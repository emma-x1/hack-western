## Setup
To port your localhost on Cloudfare:

Prereq: `brew install cloudfared` if you haven't already

```
uvicorn main:app --reload
cloudflared tunnel --url http://localhost:8000
```


