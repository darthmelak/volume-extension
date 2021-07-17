const min = 0
const max = 100
const $display = document.getElementById('display')
const $slider = document.getElementById('slider')
$display.min = min
$display.max = max
$slider.min = min
$slider.max = max
let currentTab = ''

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === `volume-${currentTab}`) $display.value = $slider.value = newValue
        if (key === 'disabled') $display.disabled = $slider.disabled = newValue
    }
})

function setValue(val) {
    chrome.storage.local.set({ [`volume-${currentTab}`]: val })
}

$slider.addEventListener('input', () => {
    setValue($slider.value)
})
$display.addEventListener('input', () => {
    setValue($display.value)
})
$display.addEventListener('blur', () => {
    if ($display.value < min) setValue(min)
    if ($display.value > max) setValue(max)
})

function bindVolume() {
    $media = document.querySelector('video, audio')
    chrome.storage.local.set({ disabled: !$media })
    if ($media) {
        chrome.storage.local.get(['currentTab'], (result) => {
            const storeKey = `volume-${result.currentTab}`
            const currentVolume = Math.floor($media.volume * 100)
            chrome.storage.local.set({ [storeKey]: currentVolume })

            if (!window.volumeBound) {
                console.log('Bound volume control extension')
                chrome.storage.onChanged.addListener((changes, namespace) => {
                    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                        if (key === storeKey) {
                            $media.volume = newValue / 100
                        }
                    }
                })
            }
            window.volumeBound = true
        })
    }
}

async function run() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    currentTab = tab.id
    chrome.storage.local.set({ currentTab })
    const key = `volume-${currentTab}`
    chrome.storage.local.get([key], (result) => {
        $display.value = $slider.value = result[key] || max
    })

    if (tab.audible) {
        document.querySelector('body').style.backgroundColor = 'orange'
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: bindVolume,
    });
}
run()
