const dateTimeFormat = {
    hour12: false, hour: "numeric", minute: "numeric"
}
const dateTimeUpdateFreq = 1000
const weatherOpts = {
    latitude: -45.89550,
    longitude: 170.48433,
}

const aiUpdateFreqMs = 1000 * 60 * 60 * 24

const getCurrentDateTime = () => new Date(Date.now())

const setTimeText = () => {
    const setTime = () =>
        document.querySelector("#time-text").textContent = new Intl.DateTimeFormat("en-US", dateTimeFormat).format(getCurrentDateTime())

    setInterval(setTime, dateTimeUpdateFreq)
    setTime()

}

const getWeatherInfoText = async () => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherOpts.latitude}&longitude=${weatherOpts.longitude}&current=temperature`)
        const data = await res.json()
        return `${data.current.temperature}${data.current_units.temperature}`
    } catch (err) {
        throw `Failed to fetch weather data:\n ${err}`
    }

}

const setWeatherInfoText = async () => {
    const textEle = document.querySelector("#weather-widget-description")
    try {
        textEle.textContent = await getWeatherInfoText()
        textEle.classList.remove("error")
    } catch (err) {
        textEle.classList.add("error")
        textEle.textContent = err
    }
}

const getTimedGreetingText = hour => {
    let greeting = ""
    if (hour >= 12 && hour <= 17) {
        greeting = "Good afternoon"
    } else if (hour > 17 && hour <= 23) {
        greeting = "Evening..."
    } else if (hour > 0 && hour < 5) {
        greeting = "Yawn..."
    } else {
        greeting = "Good morning"
    }
    return greeting
}

const setGreeting = () => {
    document.querySelector("#greeting-text").textContent = getTimedGreetingText(getCurrentDateTime().getHours())
}

const getCachedAIResponse = () => JSON.parse(localStorage.getItem("izzypage-word-response"))
const storeCachedAIResponse = response => {
    localStorage.setItem("izzypage-word-response", JSON.stringify(response))
    localStorage.setItem("izzypage-word-time", Date.now())
}

/** Returns true if thresholdMs has elapsed since the last AI response was stored in the cache */
const cachedAIResponseTimeElapsed = thresholdMs => {
    const timeSince = localStorage.getItem("izzypage-word-time")
    const currentMs = Date.now()
    if (currentMs - timeSince > thresholdMs) {
        return true
    }
    return false
}


const getOpenAPIKey = async () => {
    const res = await fetch("./assets/open-api-key.json")
    const js = await res.json()
    return js.key
}

const fetchOpenAIResponse = async () => {
    const key = await getOpenAPIKey()
    const prompt = {
        "model": "gpt-3.5-turbo-16k",
        "messages": [
            {
                "role": "user",
                "content": "Random russian word"
            }
        ]
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`

        },
        body: JSON.stringify(prompt)
    })

    if(res.status == 429) {
        throw "Your OpenAI request was rejected due to quota limit restrictions."
    }

    const data = await res.json()
    return data
}

const getOpenAIResponse = async () => {

    try {
        let aiResponse
        if (cachedAIResponseTimeElapsed(aiUpdateFreqMs)) {
            console.log("FETCHING NEW AI RESPONSE")
            aiResponse = await fetchOpenAIResponse()
            storeCachedAIResponse(aiResponse)
        } else {
            console.log("USING CACHED RESPONSE")
            aiResponse = getCachedAIResponse()
        }
        document.querySelector("#daily-word-content").textContent = aiResponse.choices[0].message.content
    } catch (err) {
        document.querySelector(".daily-word-section .error-text").textContent = err
    }
}

const getPinnedLinksData = () => {
    const pinnedLinksData = localStorage.getItem("izzypage-pinned")
    if(pinnedLinksData == null) {
        return []
    } else {
        return JSON.parse(pinnedLinksData)
    }
}

const hookPinInput = () => {
    const onPinEvent = ev => {
        const link = ev.target.value
        if(link == null || link.length < 1) {
            return
        }
        localStorage.setItem("izzypage-pinned", JSON.stringify([...getPinnedLinksData(), link]))
        updatePinnedLinksDisplay()
    }

    document.querySelector("#pin-input").addEventListener("change", onPinEvent)
}

const removePin = link => {
    const data = getPinnedLinksData()
    data.splice(data.indexOf(link), 1)
    localStorage.setItem("izzypage-pinned", JSON.stringify(data))
}

const updatePinnedLinksDisplay = () => {
    const createPinnedLinkEle = link => {
        const wrap = document.createElement("div")
        wrap.classList.add("pinned-link")
        const linkEle = document.createElement("a")
        linkEle.href = link
        linkEle.textContent = link
        wrap.appendChild(linkEle)

        const imgEle = document.createElement("img")
        imgEle.src = "./assets/backspace_FILL0_wght400_GRAD0_opsz24.svg"
        imgEle.dataset["link"] = link
        wrap.appendChild(imgEle)
        imgEle.addEventListener("click", ev => {
            removePin(ev.target.dataset["link"])
            updatePinnedLinksDisplay()
        })

        return wrap
    }
    
    const container = document.querySelector("#pinned-links-container")
    container.innerHTML = ""

    getPinnedLinksData().forEach(link => {
        const ele = createPinnedLinkEle(link)
        container.appendChild(ele)
    });
}

setTimeText()
setWeatherInfoText()
setGreeting()

getOpenAIResponse()

hookPinInput()
updatePinnedLinksDisplay()