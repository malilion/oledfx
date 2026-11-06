import * as blink from './eyes/blink.js';
import * as happySquint from './eyes/happy-squint.js';
import * as eyesCuriousTilt from './eyes/curious-tilt.js';
import * as eyesSleepy from './eyes/sleepy.js';
import * as eyesHeart from './eyes/heart.js';
import * as eyesStar from './eyes/star.js';
import * as eyesSurprised from './eyes/surprised.js';
import * as eyesCharging from './eyes/charging.js';
import * as eyesAngry from './eyes/angry.js';
import * as eyesDizzy from './eyes/dizzy.js';
import * as eyesGlitch from './eyes/glitch.js';
import * as eyesWink from './eyes/wink.js';
import * as eyesSad from './eyes/sad.js';
import * as eyesCrying from './eyes/crying.js';
import * as eyesSleeping from './eyes/sleeping.js';
import * as eyesShy from './eyes/shy.js';
import * as eyesSuspicious from './eyes/suspicious.js';
import * as eyesExcited from './eyes/excited.js';
import * as eyesDetermined from './eyes/determined.js';
import * as eyesListening from './eyes/listening.js';
import * as eyesSearching from './eyes/searching.js';
import * as eyesRobot from './eyes/robot.js';
import * as eyesSparkle from './eyes/sparkle.js';
import * as eyesDeadpan from './eyes/deadpan.js';
import * as eyesLoading from './eyes/loading.js';
import * as weatherSun from './weather/sun.js';
import * as weatherCloudy from './weather/cloudy.js';
import * as weatherRain from './weather/rain.js';
import * as weatherThunderstorm from './weather/thunderstorm.js';
import * as weatherSnow from './weather/snow.js';
import * as weatherFog from './weather/fog.js';
import * as weatherWind from './weather/wind.js';
import * as weatherMoon from './weather/moon.js';
import * as systemWifi from './system/wifi.js';
import * as systemBluetooth from './system/bluetooth.js';
import * as systemOta from './system/ota.js';
import * as systemBattery from './system/battery.js';
import * as systemCpu from './system/cpu.js';
import * as systemThermometer from './system/thermometer.js';
import * as systemHumidity from './system/humidity.js';
import * as systemHeartbeat from './system/heartbeat.js';
import * as pomodoroHourglass from './pomodoro/hourglass.js';
import * as pomodoroCoffee from './pomodoro/coffee.js';
import * as pomodoroCampfire from './pomodoro/campfire.js';
import * as pomodoroFlipClock from './pomodoro/flip-clock.js';
import * as pomodoroFireworks from './pomodoro/fireworks.js';
import * as pomodoroFocusRing from './pomodoro/focus-ring.js';
import * as transitionsCrt from './transitions/crt.js';
import * as transitionsBlinds from './transitions/blinds.js';
import * as transitionsDissolve from './transitions/dissolve.js';
import * as transitionsRadar from './transitions/radar.js';
import * as transitionsWipe from './transitions/wipe.js';
import * as transitionsIris from './transitions/iris.js';
import * as legacyEyes from './eyes.js';
import * as legacyHappySquint from './happy-squint.js';

// Canonical IDs enumerate once; old IDs remain available to existing users.
export const effects = Object.freeze(Object.defineProperties({
  'eyes/blink': blink,
  'eyes/happy-squint': happySquint,
  'eyes/curious-tilt': eyesCuriousTilt,
  'eyes/sleepy': eyesSleepy,
  'eyes/heart': eyesHeart,
  'eyes/star': eyesStar,
  'eyes/surprised': eyesSurprised,
  'eyes/charging': eyesCharging,
  'eyes/angry': eyesAngry,
  'eyes/dizzy': eyesDizzy,
  'eyes/glitch': eyesGlitch,
  'eyes/wink': eyesWink,
  'eyes/sad': eyesSad,
  'eyes/crying': eyesCrying,
  'eyes/sleeping': eyesSleeping,
  'eyes/shy': eyesShy,
  'eyes/suspicious': eyesSuspicious,
  'eyes/excited': eyesExcited,
  'eyes/determined': eyesDetermined,
  'eyes/listening': eyesListening,
  'eyes/searching': eyesSearching,
  'eyes/robot': eyesRobot,
  'eyes/sparkle': eyesSparkle,
  'eyes/deadpan': eyesDeadpan,
  'eyes/loading': eyesLoading,
  'weather/sun': weatherSun,
  'weather/cloudy': weatherCloudy,
  'weather/rain': weatherRain,
  'weather/thunderstorm': weatherThunderstorm,
  'weather/snow': weatherSnow,
  'weather/fog': weatherFog,
  'weather/wind': weatherWind,
  'weather/moon': weatherMoon,
  'system/wifi': systemWifi,
  'system/bluetooth': systemBluetooth,
  'system/ota': systemOta,
  'system/battery': systemBattery,
  'system/cpu': systemCpu,
  'system/thermometer': systemThermometer,
  'system/humidity': systemHumidity,
  'system/heartbeat': systemHeartbeat,
  'pomodoro/hourglass': pomodoroHourglass,
  'pomodoro/coffee': pomodoroCoffee,
  'pomodoro/campfire': pomodoroCampfire,
  'pomodoro/flip-clock': pomodoroFlipClock,
  'pomodoro/fireworks': pomodoroFireworks,
  'pomodoro/focus-ring': pomodoroFocusRing,
  'transitions/crt': transitionsCrt,
  'transitions/blinds': transitionsBlinds,
  'transitions/dissolve': transitionsDissolve,
  'transitions/radar': transitionsRadar,
  'transitions/wipe': transitionsWipe,
  'transitions/iris': transitionsIris
}, {
  eyes: { value: legacyEyes }, 'happy-squint': { value: legacyHappySquint }
}));

export const categories = Object.freeze([...new Set(Object.keys(effects).map(id => id.split('/')[0]))]);
export const catalog = Object.freeze(Object.values(effects).map(({ meta }) => meta));
