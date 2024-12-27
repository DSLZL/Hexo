var posts=["2024/12/27/2/","2024/12/27/1/","2024/12/27/5/","2024/12/27/4/","2024/12/27/临时公告/","2024/12/27/3/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };