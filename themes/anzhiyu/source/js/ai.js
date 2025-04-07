async function sha(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}
async function md5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

export default {
  async fetch(request, env, ctx) {
    const db = env.blog_summary;
    const url = new URL(request.url);
    const query = decodeURIComponent(url.searchParams.get('id'));
    const commonHeader = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': "*",
      'Access-Control-Allow-Headers': "*",
      'Access-Control-Max-Age': '86400',
    }
    if (query == "null") {
      return new Response("id cannot be none", {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': "*",
          'Access-Control-Allow-Headers': "*",
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    if (url.pathname.startsWith("/summary")) {
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      if (!result) {
        return new Response("No Record", {
          headers: commonHeader
        });
      }

      const messages = [
        {
          role: "system", content: `
          你是一个专业的文章摘要助手。你的主要任务是对各种文章进行精炼和摘要，帮助用户快速了解文章的核心内容。你读完整篇文章后，能够提炼出文章的关键信息，以及作者的主要观点和结论。
          技能
            精炼摘要：能够快速阅读并理解文章内容，提取出文章的主要关键点，用简洁明了的中文进行阐述。
            关键信息提取：识别文章中的重要信息，如主要观点、数据支持、结论等，并有效地进行总结。
            客观中立：在摘要过程中保持客观中立的态度，避免引入个人偏见。
          约束
            输出内容必须以中文进行。
            必须确保摘要内容准确反映原文章的主旨和重点。
            尊重原文的观点，不能进行歪曲或误导。
            在摘要中明确区分事实与作者的意见或分析。
          提示
            不需要在回答中注明摘要（不需要使用冒号），只需要输出内容。
          格式
            你的回答格式应该如下：
              这篇文章介绍了<这里是内容>
          ` },
        { role: "user", content: result.substring(0, 5000) }
      ]

      const stream = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
        messages,
        stream: true,
      });

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': "*",
          'Access-Control-Allow-Headers': "*",
          'Access-Control-Max-Age': '86400',
        }
      });
    } else if (url.pathname.startsWith("/get_summary")) {
      const orig_sha = decodeURIComponent(url.searchParams.get('sign'));
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      if (!result) {
        return new Response("no", {
          headers: commonHeader
        });
      }
      let result_sha = await sha(result);
      if (result_sha != orig_sha) {
        return new Response("no", {
          headers: commonHeader
        });
      } else {
        let resp = await db.prepare(
          "SELECT summary FROM blog_summary WHERE id = ?1"
        ).bind(query).first("summary");
        if (resp) {
          return new Response(resp, {
            headers: commonHeader
          });
        } else {
          const messages = [
            {
              role: "system", content: `
          你是一个专业的文章摘要助手。你的主要任务是对各种文章进行精炼和摘要，帮助用户快速了解文章的核心内容。你读完整篇文章后，能够提炼出文章的关键信息，以及作者的主要观点和结论。
          技能
            精炼摘要：能够快速阅读并理解文章内容，提取出文章的主要关键点，用简洁明了的中文进行阐述。
            关键信息提取：识别文章中的重要信息，如主要观点、数据支持、结论等，并有效地进行总结。
            客观中立：在摘要过程中保持客观中立的态度，避免引入个人偏见。
          约束
            输出内容必须以中文进行。
            必须确保摘要内容准确反映原文章的主旨和重点。
            尊重原文的观点，不能进行歪曲或误导。
            在摘要中明确区分事实与作者的意见或分析。
          提示
            不需要在回答中注明摘要（不需要使用冒号），只需要输出内容。
          格式
            你的回答格式应该如下：
              这篇文章介绍了<这里是内容>
          ` },
            { role: "user", content: result.substring(0, 5000) }
          ]

          const answer = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
            messages,
            stream: false,
          });
          resp = answer.response
          await db.prepare("UPDATE blog_summary SET summary = ?1 WHERE id = ?2")
            .bind(resp, query).run();
          return new Response(resp, {
            headers: commonHeader
          });
        }
      }
    } else if (url.pathname.startsWith("/is_uploaded")) {
      const orig_sha = decodeURIComponent(url.searchParams.get('sign'));
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      if (!result) {
        return new Response("no", {
          headers: commonHeader
        });
      }
      let result_sha = await sha(result);
      if (result_sha != orig_sha) {
        return new Response("no", {
          headers: commonHeader
        });
      } else {
        return new Response("yes", {
          headers: commonHeader
        });
      }
    } else if (url.pathname.startsWith("/upload_blog")) {
      if (request.method == "POST") {
        const data = await request.text();
        let result = await db.prepare(
          "SELECT content FROM blog_summary WHERE id = ?1"
        ).bind(query).first("content");
        if (!result) {
          await db.prepare("INSERT INTO blog_summary(id, content) VALUES (?1, ?2)")
            .bind(query, data).run();
          result = await db.prepare(
            "SELECT content FROM blog_summary WHERE id = ?1"
          ).bind(query).first("content");
        }
        if (result != data) {
          await db.prepare("UPDATE blog_summary SET content = ?1, summary = NULL WHERE id = ?2")
            .bind(data, query).run();
        }
        return new Response("OK", {
          headers: commonHeader
        });
      } else {
        return new Response("need post", {
          headers: commonHeader
        });
      }
    } else if (url.pathname.startsWith("/count_click")) {
      let id_md5 = await md5(query);
      let count = await db.prepare("SELECT `counter` FROM `counter` WHERE `url` = ?1")
        .bind(id_md5).first("counter");
      if (url.pathname.startsWith("/count_click_add")) {
        if (!count) {
          await db.prepare("INSERT INTO `counter` (`url`, `counter`) VALUES (?1, 1)")
            .bind(id_md5).run();
          count = 1;
        } else {
          count += 1;
          await db.prepare("UPDATE `counter` SET `counter` = ?1 WHERE `url` = ?2")
            .bind(count, id_md5).run();
        }
      }
      if (!count) {
        count = 0;
      }
      return new Response(count, {
        headers: commonHeader
      });
    } else {
      return Response.redirect("https://mabbs.github.io", 302)
    }
  }
}