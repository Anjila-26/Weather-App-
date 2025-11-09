const API_KEY = "....";

// Weather configuration object for better organization
const WEATHER_CONFIG = {
  cold: {
    frames: 7,
    animationPath: 'Animations/cold/Frame',
    bgClass: 'night-bg'
  },
  cloudy: {
    frames: 6,
    animationPath: 'Animations/cloudy/Cloudy',
    bgClass: 'cloudy-bg'
  },
  rainy: {
    frames: 4,
    animationPath: 'Animations/rainy/rain',
    bgClass: 'rainy-bg'
  },
  sunny: {
    frames: 6,
    animationPath: 'Animations/sunny/fun',
    bgClass: 'sunny-bg'
  },
  night: {
    frames: 6,
    animationPath: 'Animations/sunny/fun',
    bgClass: 'night-bg'
  }
};

// Clothing recommendations based on temperature and weather
const CLOTHING_RECOMMENDATIONS = {
  freezing: {
    items: ['Heavy winter coat', 'Thick scarf', 'Gloves', 'Warm boots', 'Thermal layers'],
    title: 'Bundle up warmly'
  },
  cold: {
    items: ['Warm jacket', 'Sweater', 'Long pants', 'Closed shoes', 'Light scarf'],
    title: 'Dress warmly'
  },
  cool: {
    items: ['Light jacket', 'Long sleeves', 'Jeans', 'Sneakers'],
    title: 'Light layers'
  },
  mild: {
    items: ['Light sweater', 'T-shirt', 'Comfortable pants', 'Any shoes'],
    title: 'Comfortable clothing'
  },
  warm: {
    items: ['T-shirt', 'Shorts or light pants', 'Sandals or sneakers', 'Sunglasses'],
    title: 'Light clothing'
  },
  hot: {
    items: ['Light breathable clothes', 'Shorts', 'Sandals', 'Sunglasses', 'Hat for sun protection'],
    title: 'Stay cool'
  }
};

// Animation state
let animationInterval = null;
let currentFrame = 1;
let animationFrames = [];

// Initialize app on DOM load
document.addEventListener("DOMContentLoaded", () => {
  if ("geolocation" in navigator) {
    // Simple direct request - works best for local files
    navigator.geolocation.getCurrentPosition(fetchWeather, handleError, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    });
  } else {
    displayError("Geolocation not available", "Please enable location services");
  }
});

// Fetch weather data from API
function fetchWeather(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  // Fetch current weather
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Weather data unavailable');
      return response.json();
    })
    .then((data) => {
      updateWeatherDisplay(data);
    })
    .catch((error) => {
      console.error('Weather fetch error:', error);
      displayError("Failed to load weather", "Please try again later");
    });

  // Fetch forecast
  fetch(forecastUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Forecast unavailable');
      return response.json();
    })
    .then((data) => {
      updateForecast(data);
    })
    .catch((error) => {
      console.error('Forecast fetch error:', error);
    });

  // Fetch AQI
  fetch(aqiUrl)
    .then((response) => {
      if (!response.ok) throw new Error('AQI unavailable');
      return response.json();
    })
    .then((data) => {
      updateAQI(data);
    })
    .catch((error) => {
      console.error('AQI fetch error:', error);
    });
}

// Update tomorrow's forecast
function updateForecast(data) {
  const forecastEl = document.getElementById("tomorrowForecast");
  const recommendationEl = document.getElementById("recommendation");
  if (!forecastEl) return;

  // Get tomorrow's forecasts (next day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow

  // Find closest forecast to noon tomorrow
  let closestForecast = data.list[0];
  let minDiff = Math.abs(new Date(data.list[0].dt * 1000) - tomorrow);

  data.list.forEach(item => {
    const forecastTime = new Date(item.dt * 1000);
    const diff = Math.abs(forecastTime - tomorrow);
    if (diff < minDiff && forecastTime.getDate() === tomorrow.getDate()) {
      minDiff = diff;
      closestForecast = item;
    }
  });

  const tomorrowCondition = closestForecast.weather[0].main;
  const tomorrowTemp = Math.round(closestForecast.main.temp);

  let message = "Tomorrow: ";

  // Show weather condition without emoji
  if (tomorrowCondition.toLowerCase().includes('rain')) {
    message += "Rainy";
  } else if (tomorrowCondition.toLowerCase().includes('cloud')) {
    message += "Cloudy";
  } else if (tomorrowCondition.toLowerCase().includes('clear')) {
    message += "Sunny";
  } else if (tomorrowCondition.toLowerCase().includes('snow')) {
    message += "Snowy";
  } else if (tomorrowCondition.toLowerCase().includes('thunder')) {
    message += "Stormy";
  } else {
    message += tomorrowCondition;
  }

  forecastEl.textContent = message;
  forecastEl.style.display = 'block';

  // Get clothing recommendations based on tomorrow's weather
  if (recommendationEl) {
    const clothingRec = getClothingRecommendation(tomorrowTemp, tomorrowCondition);
    // Take max 2 items and join with comma
    const clothingText = clothingRec.items.slice(0, 2).join(', ');
    recommendationEl.innerHTML = "Recommendation:<br>" + clothingText;
  }
}


// Update AQI display
function updateAQI(data) {
  const aqiEl = document.getElementById("aqi");
  if (!aqiEl) return;

  // Get PM2.5 value as AQI number
  const pm25 = Math.round(data.list[0].components.pm2_5);

  aqiEl.textContent = `AQI: ${pm25}`;
}

// Determine weather condition based on data
function determineWeatherCondition(data, isNight) {
  const temp = data.main.temp;
  const weatherMain = data.weather[0].main.toLowerCase();
  const weatherDescription = data.weather[0].description.toLowerCase();
  
  // Debug logging
  console.log('=== WEATHER DEBUG ===');
  console.log('Temperature:', temp);
  console.log('Weather Main:', weatherMain);
  console.log('Weather Description:', weatherDescription);
  console.log('Is Night:', isNight);
  console.log('Full weather data:', data.weather[0]);
  
  // Priority 1: Check for rainy weather first (takes precedence)
  if (weatherMain.includes("rain") && !weatherMain.includes("drizzle")) {
    console.log('✅ DETECTED: RAINY');
    return 'rainy';
  }
  
  // Priority 2: Check temperature for cold weather
  if (temp < 15) {
    console.log('✅ DETECTED: COLD (temp < 15)');
    return 'cold';
  }
  
  // Priority 3: Check if it's night (for background)
  if (isNight) {
    console.log('✅ DETECTED: NIGHT');
    return 'night'; // Night background regardless of clouds
  }

  //Priority 4: Check if it's night (for background)
  if (weatherMain.includes("rain")) {
    console.log('✅ DETECTED: RAINY');
    return 'rainy';
  }
  
  //Priority 4: Check if it's night (for background)
  if (weatherMain.includes("cloud") || weatherMain.includes("drizzle")) {
    console.log('✅ DETECTED: CLOUDY');
    return 'cloudy';
  }
  
  // Priority 5: Default to sunny for clear warm days
  console.log('✅ DETECTED: SUNNY (default)');
  return 'sunny';
}

// Get clothing recommendation based on temperature
function getClothingRecommendation(temp, weatherMain) {
  let category;
  
  if (temp < 0) {
    category = 'freezing';
  } else if (temp < 10) {
    category = 'cold';
  } else if (temp < 15) {
    category = 'cool';
  } else if (temp < 20) {
    category = 'mild';
  } else if (temp < 25) {
    category = 'warm';
  } else {
    category = 'hot';
  }
  
  const recommendation = { ...CLOTHING_RECOMMENDATIONS[category] };
  
  // Add rain gear if it's rainy
  if (weatherMain.includes('rain')) {
    recommendation.items = ['Umbrella', 'Rain jacket', ...recommendation.items];
    recommendation.title = 'Rain protection needed';
  }
  
  return recommendation;
}

// Get weather-based message
function getWeatherMessage(temp, weatherMain, isNight) {
  if (isNight) {
    return temp < 15 ? "It's a cold night..." : "It's a lovely night...";
  }
  
  if (weatherMain.includes('rain')) {
    return temp < 15 ? "It's cold and raining..." : "It's raining today!";
  } else if (weatherMain.includes('cloud')) {
    return temp < 15 ? "It's cold and cloudy..." : "It's a cloudy day...";
  } else if (temp > 25) {
    return "It's a hot day!";
  } else {
    return "It's a nice day!";
  }
}

// Update the weather display
function updateWeatherDisplay(data) {
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const weatherMain = data.weather[0].main.toLowerCase();
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  
  console.log('=== UPDATE WEATHER DISPLAY ===');
  console.log('Current hour:', hour);
  
  // Get DOM elements
  const container = document.getElementById("weatherContainer");
  const weatherMessage = document.getElementById("weatherMessage");
  const temperatureEl = document.getElementById("temperature");
  const feelsLikeEl = document.getElementById("feelsLike");
  const humidityEl = document.getElementById("humidity");

  // Determine weather condition
  const weatherCondition = determineWeatherCondition(data, isNight);
  const config = WEATHER_CONFIG[weatherCondition];
  
  console.log('Selected Weather Condition:', weatherCondition);
  console.log('Animation Config:', config);

  // Update container background
  container.className = `container ${config.bgClass}`;

  // Change all text to black for sunny weather
  const weatherContent = document.querySelector('.weather-content');
  const aqiEl = document.getElementById("aqi");
  const tomorrowForecast = document.getElementById("tomorrowForecast");
  const recommendationEl = document.getElementById("recommendation");
  
  if (weatherCondition === 'sunny') {
    // Black text for sunny weather - apply to all elements
    weatherContent.style.color = '#000';
    if (weatherMessage) weatherMessage.style.color = '#000';
    if (temperatureEl) temperatureEl.style.color = '#000';
    if (feelsLikeEl) feelsLikeEl.style.color = '#000';
    if (humidityEl) humidityEl.style.color = '#000';
    if (aqiEl) aqiEl.style.color = '#000';
    if (tomorrowForecast) tomorrowForecast.style.color = '#000';
    if (recommendationEl) recommendationEl.style.color = '#000';
  } else {
    // White text for all other weather
    weatherContent.style.color = '#fff';
    if (weatherMessage) weatherMessage.style.color = '#fff';
    if (temperatureEl) temperatureEl.style.color = '#fff';
    if (feelsLikeEl) feelsLikeEl.style.color = '#fff';
    if (humidityEl) humidityEl.style.color = '#fff';
    if (aqiEl) aqiEl.style.color = '#fff';
    if (tomorrowForecast) tomorrowForecast.style.color = '#fff';
    if (recommendationEl) recommendationEl.style.color = '#fff';
  }

  // Generate animation frames array
  animationFrames = Array.from({ length: config.frames }, (_, i) => i + 1);

  // Update text content
  weatherMessage.textContent = getWeatherMessage(temp, weatherMain, isNight);
  temperatureEl.textContent = `${temp}°C`;

  // Update feels like (only if significantly different)
  if (feelsLikeEl) {
    if (Math.abs(temp - feelsLike) >= 3) {
      feelsLikeEl.textContent = `Feels like ${feelsLike}°C`;
      feelsLikeEl.style.display = 'block';
    } else {
      feelsLikeEl.style.display = 'none';
    }
  }

  // Update humidity
  if (humidityEl) {
    humidityEl.textContent = `Humidity: ${humidity}%`;
  }

  // Clothing recommendations now shown in "Recommendation" section only
  // displayClothingRecommendations(temp, weatherMain);

  // Start character animation
  startCharacterAnimation(weatherCondition, config, isNight);
}

// Display clothing recommendations
function displayClothingRecommendations(temp, weatherMain) {
  const clothingEl = document.getElementById("clothingRecommendations");
  
  if (!clothingEl) return;
  
  const recommendation = getClothingRecommendation(temp, weatherMain);
  
  // Create clothing recommendation HTML
  let clothingHTML = `
    <div class="clothing-header">
      <span class="clothing-title">${recommendation.title}</span>
    </div>
    <ul class="clothing-list">
  `;
  
  recommendation.items.forEach(item => {
    clothingHTML += `<li>${item}</li>`;
  });
  
  clothingHTML += '</ul>';
  
  clothingEl.innerHTML = clothingHTML;
  
  // Add fade-in animation
  clothingEl.style.opacity = '0';
  setTimeout(() => {
    clothingEl.style.opacity = '1';
  }, 300);
}

// Start character animation with smooth transitions
function startCharacterAnimation(condition, config, isNight) {
  const character = document.getElementById("character");
  const characterContainer = document.querySelector(".character-container");
  
  if (!character || !characterContainer) return;
  
  // Always position character on the right side
  characterContainer.style.left = 'auto';
  characterContainer.style.right = '10px';
  character.style.transform = 'scaleX(-1)'; // Flip to face left
  
  // Clear any existing animation
  if (animationInterval) {
    clearInterval(animationInterval);
  }
  
  let frameIndex = 0;
  
  // Function to cycle through frames
  function animateFrames() {
    const frameNumber = animationFrames[frameIndex % animationFrames.length];
    const imagePath = `${config.animationPath}${frameNumber}.png`;
    
    character.style.backgroundImage = `url('${imagePath}')`;
    
    frameIndex++;
    
    // Loop back to start after all frames
    if (frameIndex >= animationFrames.length) {
      frameIndex = 0;
    }
  }
  
  // Set initial frame
  character.style.backgroundImage = `url('${config.animationPath}1.png')`;
  
  // Start animation with smoother timing
  animationInterval = setInterval(animateFrames, 1500);
}

// Handle geolocation errors
// Improved geolocation error handler with clearer messaging
function handleError(error) {
  console.warn('Geolocation error code:', error && error.code, error && error.message);

  if (!error) {
    showLocationError('Location unavailable', 'Unable to determine your location');
    return;
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      showLocationError(
        'Location access denied',
        'Please allow location access when prompted, or check browser settings.'
      );
      break;
    case error.POSITION_UNAVAILABLE:
      showLocationError(
        'Location unavailable',
        'Try running with: python3 -m http.server 8000, then open http://localhost:8000/popup.html'
      );
      break;
    case error.TIMEOUT:
      showLocationError('Location request timed out', 'Please try again.');
      break;
    default:
      showLocationError('Location error', 'Unable to determine your location.');
      break;
  }
}

// Display a prominent location error and offer a Retry button
function showLocationError(mainMessage, subMessage) {
  const weatherMessage = document.getElementById('weatherMessage');
  const tempMessage = document.getElementById('tempMessage');

  if (weatherMessage) weatherMessage.textContent = mainMessage;
  if (tempMessage) tempMessage.textContent = subMessage;

  // Add a retry button if not already present
  let retryBtn = document.getElementById('locationRetryBtn');
  if (!retryBtn) {
    retryBtn = document.createElement('button');
    retryBtn.id = 'locationRetryBtn';
    retryBtn.textContent = 'Retry';
    retryBtn.style.cssText = 'position: absolute; bottom: 12px; right: 12px; z-index: 10; padding: 6px 10px; font-family: LoRes12, monospace; font-size:12px; cursor:pointer; border-radius:4px; background:#fff8; border:1px solid rgba(0,0,0,0.2);';
    retryBtn.addEventListener('click', () => {
      retryBtn.textContent = 'Retrying...';
      // Reload the page to retry
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
    document.body.appendChild(retryBtn);
  }
}

// Display error messages
function displayError(mainMessage, subMessage) {
  const weatherMessage = document.getElementById("weatherMessage");
  const tempMessage = document.getElementById("tempMessage");
  
  if (weatherMessage) weatherMessage.textContent = mainMessage;
  if (tempMessage) tempMessage.textContent = subMessage;
  
  // Hide clothing recommendations on error
  const clothingEl = document.getElementById("clothingRecommendations");
  if (clothingEl) clothingEl.style.display = 'none';
}

// Optional: Add refresh functionality
function refreshWeather() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(fetchWeather, handleError);
  }
}

// Optional: Expose refresh function globally if you want a refresh button
window.refreshWeather = refreshWeather;