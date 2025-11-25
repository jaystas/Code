import requests
import json

openrouter_api_key= "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"

prompt = "Tell me a joke."

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
  "Authorization": f"Bearer <OPENROUTER_API_KEY>",
  "Content-Type": "application/json"
}

payload = {
  "model": "qwen/qwen3-235b-a22b-2507",
  "messages": [{"role": "user", "content": prompt}],
  "stream": True
}

buffer = ""
with requests.post(url, headers=headers, json=payload, stream=True) as r:
  for chunk in r.iter_content(chunk_size=1024, decode_unicode=True):
    buffer += chunk
    while True:
      try:
        # Find the next complete SSE line
        line_end = buffer.find('\n')
        if line_end == -1:
          break

        line = buffer[:line_end].strip()
        buffer = buffer[line_end + 1:]

        if line.startswith('data: '):
          data = line[6:]
          if data == '[DONE]':
            break

          try:
            data_obj = json.loads(data)
            content = data_obj["choices"][0]["delta"].get("content")
            if content:
              print(content, end="", flush=True)
          except json.JSONDecodeError:
            pass
      except Exception:
        break
