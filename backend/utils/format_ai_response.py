#utils 
import re

def format_roadmap_response(response_text):
    # 🧹 Clean unwanted artifacts
    cleaned_text = re.sub(r"📋 Copy", "", response_text)
    cleaned_text = re.sub(r'<button.*?</button>', '', cleaned_text, flags=re.DOTALL)
    cleaned_text = re.sub(r'style="[^"]+"', "", cleaned_text)

    # 🧱 Wrap code blocks
    code_block_pattern = re.compile(r"```(?:[a-zA-Z]*)?\n(.*?)```", re.DOTALL)

    def replacer(match):
        code = match.group(1).strip()
        return f'<div class="code-block"><pre><code>{code}</code></pre></div>'

    return code_block_pattern.sub(replacer, cleaned_text).strip()
