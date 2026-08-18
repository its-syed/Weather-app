const API_URL =
    "https://api.open-meteo.com/v1/forecast";

const GEO_URL =
    "https://geocoding-api.open-meteo.com/v1/search";


let currentLocation = null;
let weatherData = null;

let isFahrenheit = false;


/* =========================
   ELEMENTS
========================= */

const searchForm =
    document.getElementById("searchForm");

const cityInput =
    document.getElementById("cityInput");

const locationBtn =
    document.getElementById("locationBtn");

const loading =
    document.getElementById("loading");

const errorBox =
    document.getElementById("error");

const weatherContent =
    document.getElementById("weatherContent");


/* =========================
   WEATHER CODES
========================= */

const weatherCodes = {

    0: {
        text: "Clear sky",
        icon: "☀️"
    },

    1: {
        text: "Mainly clear",
        icon: "🌤️"
    },

    2: {
        text: "Partly cloudy",
        icon: "⛅"
    },

    3: {
        text: "Overcast",
        icon: "☁️"
    },

    45: {
        text: "Foggy",
        icon: "🌫️"
    },

    48: {
        text: "Rime fog",
        icon: "🌫️"
    },

    51: {
        text: "Light drizzle",
        icon: "🌦️"
    },

    53: {
        text: "Drizzle",
        icon: "🌦️"
    },

    55: {
        text: "Heavy drizzle",
        icon: "🌧️"
    },

    61: {
        text: "Light rain",
        icon: "🌦️"
    },

    63: {
        text: "Rain",
        icon: "🌧️"
    },

    65: {
        text: "Heavy rain",
        icon: "🌧️"
    },

    71: {
        text: "Light snow",
        icon: "🌨️"
    },

    73: {
        text: "Snow",
        icon: "❄️"
    },

    75: {
        text: "Heavy snow",
        icon: "❄️"
    },

    80: {
        text: "Rain showers",
        icon: "🌦️"
    },

    81: {
        text: "Rain showers",
        icon: "🌧️"
    },

    82: {
        text: "Heavy showers",
        icon: "⛈️"
    },

    95: {
        text: "Thunderstorm",
        icon: "⛈️"
    },

    96: {
        text: "Thunderstorm + hail",
        icon: "⛈️"
    },

    99: {
        text: "Severe thunderstorm",
        icon: "⛈️"
    }

};


/* =========================
   SEARCH CITY
========================= */

async function searchCity(city) {

    if (!city || city.trim().length < 2) {

        showError(
            "Please enter at least 2 characters."
        );

        return;
    }


    showLoading(true);


    try {

        const response = await fetch(
            `${GEO_URL}?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
        );


        if (!response.ok) {
            throw new Error(
                "Unable to search for the city."
            );
        }


        const data = await response.json();


        if (!data.results || data.results.length === 0) {

            throw new Error(
                "No matching city was found."
            );

        }


        const location = data.results[0];


        await loadWeather(
            location.latitude,
            location.longitude,
            location
        );


    } catch (error) {

        showError(error.message);

    } finally {

        showLoading(false);

    }

}


/* =========================
   LOAD WEATHER
========================= */

async function loadWeather(
    latitude,
    longitude,
    location
) {

    showLoading(true);

    hideError();


    try {

        const params = new URLSearchParams({

            latitude,
            longitude,

            current:
                "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,visibility",

            hourly:
                "temperature_2m,precipitation_probability,weather_code",

            daily:
                "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",

            timezone:
                "auto",

            forecast_days:
                "7"

        });


        const response = await fetch(
            `${API_URL}?${params}`
        );


        if (!response.ok) {

            throw new Error(
                "Weather service is currently unavailable."
            );

        }


        weatherData =
            await response.json();


        currentLocation = location;


        renderWeather();


    } catch (error) {

        showError(error.message);

    } finally {

        showLoading(false);

    }

}


/* =========================
   RENDER WEATHER
========================= */

function renderWeather() {

    if (!weatherData || !currentLocation) {
        return;
    }


    const current =
        weatherData.current;


    const code =
        weatherCodes[current.weather_code]
        || weatherCodes[0];


    const temperature =
        convertTemperature(
            current.temperature_2m
        );


    const feelsLike =
        convertTemperature(
            current.apparent_temperature
        );


    document.getElementById(
        "locationName"
    ).textContent =
        currentLocation.name;


    document.getElementById(
        "locationDetails"
    ).textContent =
        `${currentLocation.admin1 || ""}, ${currentLocation.country || ""}`;


    document.getElementById(
        "weatherIcon"
    ).textContent =
        code.icon;


    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(temperature);


    document.getElementById(
        "condition"
    ).textContent =
        code.text;


    document.getElementById(
        "feelsLike"
    ).textContent =
        Math.round(feelsLike);


    document.getElementById(
        "humidity"
    ).textContent =
        `${current.relative_humidity_2m}%`;


    document.getElementById(
        "wind"
    ).textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;


    document.getElementById(
        "rainChance"
    ).textContent =
        `${current.precipitation || 0} mm`;


    document.getElementById(
        "visibility"
    ).textContent =
        `${(current.visibility / 1000).toFixed(1)} km`;


    renderDate();

    renderSun();

    renderHourly();

    renderWeekly();


    weatherContent.style.display =
        "block";
}


/* =========================
   DATE
========================= */

function renderDate() {

    const now =
        new Date();


    const day =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long"
            }
        );


    const date =
        now.toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    document.getElementById(
        "dayName"
    ).textContent =
        day;


    document.getElementById(
        "currentDate"
    ).textContent =
        date;
}


/* =========================
   SUN
========================= */

function renderSun() {

    const sunrise =
        weatherData.daily.sunrise[0];

    const sunset =
        weatherData.daily.sunset[0];


    document.getElementById(
        "sunrise"
    ).textContent =
        formatTime(sunrise);


    document.getElementById(
        "sunset"
    ).textContent =
        formatTime(sunset);
}


/* =========================
   HOURLY
========================= */

function renderHourly() {

    const container =
        document.getElementById(
            "hourlyForecast"
        );


    container.innerHTML = "";


    const hourly =
        weatherData.hourly;


    const now =
        new Date();


    const currentHour =
        now.getHours();


    const startIndex =
        Math.min(
            currentHour,
            hourly.time.length - 1
        );


    for (
        let i = startIndex;
        i < startIndex + 24 &&
        i < hourly.time.length;
        i++
    ) {

        const time =
            new Date(hourly.time[i]);


        const code =
            weatherCodes[
                hourly.weather_code[i]
            ] || weatherCodes[0];


        const temp =
            convertTemperature(
                hourly.temperature_2m[i]
            );


        const card =
            document.createElement("div");


        card.className =
            "hour-card";


        if (i === startIndex) {
            card.classList.add("active");
        }


        card.innerHTML = `

            <p>
                ${
                    i === startIndex
                    ? "Now"
                    : formatHour(time)
                }
            </p>

            <div class="hour-icon">
                ${code.icon}
            </div>

            <strong>
                ${Math.round(temp)}°
            </strong>

        `;


        container.appendChild(card);

    }

}


/* =========================
   WEEKLY
========================= */

function renderWeekly() {

    const container =
        document.getElementById(
            "weeklyForecast"
        );


    container.innerHTML = "";


    const daily =
        weatherData.daily;


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        const date =
            new Date(daily.time[i]);


        const code =
            weatherCodes[
                daily.weather_code[i]
            ] || weatherCodes[0];


        const max =
            convertTemperature(
                daily.temperature_2m_max[i]
            );


        const min =
            convertTemperature(
                daily.temperature_2m_min[i]
            );


        const rain =
            daily.precipitation_probability_max[i];


        const card =
            document.createElement("div");


        card.className =
            "day-card";


        card.innerHTML = `

            <div class="day-name">

                ${
                    i === 0
                    ? "Today"
                    : date.toLocaleDateString(
                        "en-US",
                        { weekday: "long" }
                    )
                }

            </div>


            <div class="day-condition">

                <span>
                    ${code.icon}
                </span>

                ${code.text}

            </div>


            <div class="day-temp">

                ${Math.round(max)}°
                /
                ${Math.round(min)}°

            </div>


            <div class="day-rain">

                💧 ${rain || 0}% rain

            </div>

        `;


        container.appendChild(card);

    }

}


/* =========================
   LOCATION
========================= */

function getCurrentLocation() {

    if (!navigator.geolocation) {

        showError(
            "Geolocation is not supported by your browser."
        );

        return;

    }


    showLoading(true);


    navigator.geolocation.getCurrentPosition(

        async position => {

            const {
                latitude,
                longitude
            } = position.coords;


            try {

                const response =
                    await fetch(
                        `${GEO_URL}?latitude=${latitude}&longitude=${longitude}`
                    );


                /*
                 * The geocoding API primarily handles
                 * forward city search, so for the
                 * portfolio version we can simply
                 * display coordinates if reverse
                 * lookup isn't available.
                 */

                await loadWeather(
                    latitude,
                    longitude,
                    {
                        name: "My Location",
                        admin1: "",
                        country: ""
                    }
                );


            } catch (error) {

                showError(
                    "Could not load your location."
                );

            }

        },

        () => {

            showLoading(false);

            showError(
                "Location permission was denied."
            );

        }

    );

}


/* =========================
   TEMPERATURE
========================= */

function convertTemperature(celsius) {

    if (!isFahrenheit) {
        return celsius;
    }


    return (
        celsius * 9 / 5
    ) + 32;

}


/* =========================
   TIME
========================= */

function formatTime(value) {

    const date =
        new Date(value);


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function formatHour(date) {

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric"
        }
    );

}


/* =========================
   UI STATES
========================= */

function showLoading(show) {

    loading.style.display =
        show ? "flex" : "none";

}


function showError(message) {

    errorBox.textContent =
        message;

    errorBox.style.display =
        "block";

}


function hideError() {

    errorBox.style.display =
        "none";

}


/* =========================
   EVENTS
========================= */

searchForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        searchCity(
            cityInput.value
        );

    }
);


locationBtn.addEventListener(
    "click",
    getCurrentLocation
);


document
    .getElementById("unitToggle")
    .addEventListener(
        "click",
        () => {

            isFahrenheit =
                !isFahrenheit;

            renderWeather();

        }
    );


/* =========================
   INITIAL WEATHER
========================= */

loadWeather(
    13.04,
    74.49,
    {
        name: "Bhatkal",
        admin1: "Karnataka",
        country: "India"
    }
);
