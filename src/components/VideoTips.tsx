import React from 'react'

const VideoTips = () => {
// Fast fallback for video background
  return (
    <iframe 
      title="Youtube" 
      className="video-background--video pf-video-youtube-no-api" 
      loading="lazy" 
      src="https://www.youtube.com/embed/-WPUz7IhZ2s?enablejsapi=1&amp;mute=1&amp;loop=1&amp;playlist=-WPUz7IhZ2s&amp;controls=0&amp;rel=0&amp;showinfo=0&amp;autoplay=1" 
      frameBorder="0" 
      allow="accelerometer; autoplay *; encrypted-media;" 
      srcDoc="
        &lt;style&gt;*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img{position:absolute;width:100%;top:0;bottom:0;margin:auto;height:100%;object-fit:cover;}&lt;/style&gt;
        &lt;a href=https://www.youtube.com/embed/-WPUz7IhZ2s?enablejsapi=1&amp;mute=1&amp;loop=1&amp;playlist=-WPUz7IhZ2s&amp;controls=0&amp;rel=0&amp;showinfo=0&amp;autoplay=1 id='pf-youtube-play-button'&gt;
        &lt;img src='https://i.ytimg.com/vi/8SPu5uydAts/maxresdefault.jpg' srcset='https://i.ytimg.com/vi/-WPUz7IhZ2s/sddefault.jpg 400w' sizes='50vw' loading='lazy'&gt;
        &lt;/a&gt;
        &lt;script&gt;
        window.addEventListener('DOMContentLoaded', () =&gt; {
        const observer = new IntersectionObserver((entries, observer) =&gt; {
            console.log(entries[0].isIntersecting);
            if (entries[0].isIntersecting) {
                document.querySelector('#pf-youtube-play-button').click();
                observer.unobserve(entries[0].target);
            }
        });
        document.body &amp;&amp; observer.observe(document.body);
        });
        
    &lt;/script&gt;
    
    "></iframe>
  )
}

export default VideoTips