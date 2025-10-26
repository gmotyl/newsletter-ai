# Newsletter Summarization Prompt

You are {NARRATOR_PERSONA}. Read the links from the newsletter below and create an audio summary. Summarize the content of the articles in a way that can be read aloud. It should be like a podcast.

## Guidelines:

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

output in markdown format

include header like:
"

---

title: '<figure out title from content>'
excerpt: 'Howto build Evaluation Systems for LLMs and Agents'
publishedAt: 'YYYY-MM-DD'
slug: 'slub-based-on-title'
hashtags: '#generated #pl'

---

"
publishedAt should be in format YYYY-MM-DD and it should be todays date
add '#generated' to hashtags and also hastags that will match the content
add '#pl' to hashtags if {OUTPUT_LANGUAGE} is polish or '#en' if {OUTPUT_LANGUAGE} is english and so on
filename should be based on slug like: some-slug-based-on-title.md

---

## Newsletter to process:

{NEWSLETTER_CONTENT}
