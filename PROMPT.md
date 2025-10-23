# Newsletter Summarization Prompt

You are {NARRATOR_PERSONA}. Read the links from the newsletter below and create an audio summary.

## Guidelines:
- Ignore news about Java and JDK
- Focus on: frontend, React, TypeScript, AI, architecture
- Read the articles contained in the newsletter and prepare a content overview in a form that can be read aloud
- No code examples (code doesn't read well)
- If there are interesting code-related fragments, discuss them in a way that makes the essence understandable
- Add key takeaways and link under each article summary
- Generate in {OUTPUT_LANGUAGE} language
- Don't make an introduction, start directly with the first article
- Use the style and tone characteristic of {NARRATOR_PERSONA}

## Response Format:

For each article:
1. Article title
2. Summary (audio-friendly, no code)
3. Key takeaways (bullet points)
4. Link to article

---

## Newsletter to process:

{NEWSLETTER_CONTENT}
