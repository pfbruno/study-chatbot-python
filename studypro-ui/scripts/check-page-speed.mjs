const pages = [
  "https://www.minhaprovacao.com.br/",
  "https://www.minhaprovacao.com.br/login",
  "https://www.minhaprovacao.com.br/register",
  "https://www.minhaprovacao.com.br/dashboard",
  "https://www.minhaprovacao.com.br/dashboard/provas",
  "https://www.minhaprovacao.com.br/dashboard/simulados",
  "https://www.minhaprovacao.com.br/dashboard/treinar",
]

for (const url of pages) {
  const start = performance.now()

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MinhAprovacao-Speed-Check/1.0",
      },
    })

    const text = await response.text()
    const end = performance.now()
    const sizeKb = Math.round(Buffer.byteLength(text, "utf8") / 1024)

    console.log(`${response.status} ${Math.round(end - start)}ms ${sizeKb}KB ${url}`)
  } catch (error) {
    console.log(`ERROR ${url}`)
    console.error(error)
  }
}
