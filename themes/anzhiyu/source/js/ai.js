addEventListener("DOMContentLoaded", () => {
    const apiUrl = "https://black-forest-3b1a.q2891362919.workers.dev" // 这里填写你获得的 API 地址
    const outputContainer = document.getElementById("ai-output");
    const postTitle = document.getElementsByClassName("post-title").textContent; // 引号中填写文章 Title 的 class
    const postBeforeContent = document.getElementsByClassName("post-content").textContent; // 引号中填写文章内容容器的 class
    const postContent = postBeforeContent.replace(/\n/g, '').replace(/[ ]+/g, ' ').replace(/<pre>[\s\S]*?<\/pre>/g, '').substring(0, 1800);
  
    const evSource = new EventSource(apiUrl + `/?q=${postTitle}，文章内容：${postContent}`);
    evSource.onmessage = (event) => {
      if (event.data == "[DONE]") {
        evSource.close();
        return;
      } else {
          const data = JSON.parse(event.data);
          outputContainer.textContent += data.response ;
      }
    }
  });