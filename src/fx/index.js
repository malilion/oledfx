import * as eyes_angry from './eyes/angry.js';
import * as eyes_blink from './eyes/blink.js';
import * as eyes_charging from './eyes/charging.js';
import * as eyes_crying from './eyes/crying.js';
import * as eyes_curious_tilt from './eyes/curious-tilt.js';
import * as eyes_deadpan from './eyes/deadpan.js';
import * as eyes_determined from './eyes/determined.js';
import * as eyes_dizzy from './eyes/dizzy.js';
import * as eyes_excited from './eyes/excited.js';
import * as eyes_glitch from './eyes/glitch.js';
import * as eyes_happy_squint from './eyes/happy-squint.js';
import * as eyes_heart from './eyes/heart.js';
import * as eyes_listening from './eyes/listening.js';
import * as eyes_loading from './eyes/loading.js';
import * as eyes_robot from './eyes/robot.js';
import * as eyes_sad from './eyes/sad.js';
import * as eyes_searching from './eyes/searching.js';
import * as eyes_shy from './eyes/shy.js';
import * as eyes_sleeping from './eyes/sleeping.js';
import * as eyes_sleepy from './eyes/sleepy.js';
import * as eyes_sparkle from './eyes/sparkle.js';
import * as eyes_star from './eyes/star.js';
import * as eyes_surprised from './eyes/surprised.js';
import * as eyes_suspicious from './eyes/suspicious.js';
import * as eyes_wink from './eyes/wink.js';
import * as weather_aurora from './weather/aurora.js';
import * as weather_cloudy from './weather/cloudy.js';
import * as weather_comet from './weather/comet.js';
import * as weather_drizzle from './weather/drizzle.js';
import * as weather_fog from './weather/fog.js';
import * as weather_frost from './weather/frost.js';
import * as weather_hail from './weather/hail.js';
import * as weather_moon from './weather/moon.js';
import * as weather_rain from './weather/rain.js';
import * as weather_rainbow from './weather/rainbow.js';
import * as weather_sandstorm from './weather/sandstorm.js';
import * as weather_snow from './weather/snow.js';
import * as weather_starry from './weather/starry.js';
import * as weather_sun from './weather/sun.js';
import * as weather_sunrise from './weather/sunrise.js';
import * as weather_thunderstorm from './weather/thunderstorm.js';
import * as weather_tornado from './weather/tornado.js';
import * as weather_wind from './weather/wind.js';
import * as system_alert from './system/alert.js';
import * as system_battery from './system/battery.js';
import * as system_bell from './system/bell.js';
import * as system_bluetooth from './system/bluetooth.js';
import * as system_cpu from './system/cpu.js';
import * as system_download from './system/download.js';
import * as system_fan from './system/fan.js';
import * as system_gps from './system/gps.js';
import * as system_heartbeat from './system/heartbeat.js';
import * as system_humidity from './system/humidity.js';
import * as system_lock from './system/lock.js';
import * as system_memory from './system/memory.js';
import * as system_mic from './system/mic.js';
import * as system_ota from './system/ota.js';
import * as system_sdcard from './system/sdcard.js';
import * as system_signal from './system/signal.js';
import * as system_speaker from './system/speaker.js';
import * as system_sync from './system/sync.js';
import * as system_thermometer from './system/thermometer.js';
import * as system_unlock from './system/unlock.js';
import * as system_usb from './system/usb.js';
import * as system_wifi from './system/wifi.js';
import * as pomodoro_breathe from './pomodoro/breathe.js';
import * as pomodoro_campfire from './pomodoro/campfire.js';
import * as pomodoro_candle from './pomodoro/candle.js';
import * as pomodoro_checklist from './pomodoro/checklist.js';
import * as pomodoro_coffee from './pomodoro/coffee.js';
import * as pomodoro_desk_lamp from './pomodoro/desk-lamp.js';
import * as pomodoro_fireworks from './pomodoro/fireworks.js';
import * as pomodoro_flip_clock from './pomodoro/flip-clock.js';
import * as pomodoro_focus_ring from './pomodoro/focus-ring.js';
import * as pomodoro_hourglass from './pomodoro/hourglass.js';
import * as pomodoro_letter from './pomodoro/letter.js';
import * as pomodoro_nap from './pomodoro/nap.js';
import * as pomodoro_notebook from './pomodoro/notebook.js';
import * as pomodoro_pencil from './pomodoro/pencil.js';
import * as pomodoro_plant from './pomodoro/plant.js';
import * as pomodoro_stretch from './pomodoro/stretch.js';
import * as pomodoro_tea from './pomodoro/tea.js';
import * as pomodoro_timer_beep from './pomodoro/timer-beep.js';
import * as pomodoro_tomato from './pomodoro/tomato.js';
import * as pomodoro_water from './pomodoro/water.js';
import * as transitions_bars from './transitions/bars.js';
import * as transitions_blinds from './transitions/blinds.js';
import * as transitions_checker from './transitions/checker.js';
import * as transitions_circle_out from './transitions/circle-out.js';
import * as transitions_crt from './transitions/crt.js';
import * as transitions_diamond from './transitions/diamond.js';
import * as transitions_dissolve from './transitions/dissolve.js';
import * as transitions_fade_center from './transitions/fade-center.js';
import * as transitions_iris from './transitions/iris.js';
import * as transitions_pixels from './transitions/pixels.js';
import * as transitions_radar from './transitions/radar.js';
import * as transitions_scramble from './transitions/scramble.js';
import * as transitions_slide_up from './transitions/slide-up.js';
import * as transitions_spiral from './transitions/spiral.js';
import * as transitions_wipe from './transitions/wipe.js';
import * as legacyEyes from './eyes.js';
import * as legacyHappySquint from './happy-squint.js';

export const effects = Object.freeze(Object.defineProperties({
  'eyes/angry': eyes_angry,
  'eyes/blink': eyes_blink,
  'eyes/charging': eyes_charging,
  'eyes/crying': eyes_crying,
  'eyes/curious-tilt': eyes_curious_tilt,
  'eyes/deadpan': eyes_deadpan,
  'eyes/determined': eyes_determined,
  'eyes/dizzy': eyes_dizzy,
  'eyes/excited': eyes_excited,
  'eyes/glitch': eyes_glitch,
  'eyes/happy-squint': eyes_happy_squint,
  'eyes/heart': eyes_heart,
  'eyes/listening': eyes_listening,
  'eyes/loading': eyes_loading,
  'eyes/robot': eyes_robot,
  'eyes/sad': eyes_sad,
  'eyes/searching': eyes_searching,
  'eyes/shy': eyes_shy,
  'eyes/sleeping': eyes_sleeping,
  'eyes/sleepy': eyes_sleepy,
  'eyes/sparkle': eyes_sparkle,
  'eyes/star': eyes_star,
  'eyes/surprised': eyes_surprised,
  'eyes/suspicious': eyes_suspicious,
  'eyes/wink': eyes_wink,
  'weather/aurora': weather_aurora,
  'weather/cloudy': weather_cloudy,
  'weather/comet': weather_comet,
  'weather/drizzle': weather_drizzle,
  'weather/fog': weather_fog,
  'weather/frost': weather_frost,
  'weather/hail': weather_hail,
  'weather/moon': weather_moon,
  'weather/rain': weather_rain,
  'weather/rainbow': weather_rainbow,
  'weather/sandstorm': weather_sandstorm,
  'weather/snow': weather_snow,
  'weather/starry': weather_starry,
  'weather/sun': weather_sun,
  'weather/sunrise': weather_sunrise,
  'weather/thunderstorm': weather_thunderstorm,
  'weather/tornado': weather_tornado,
  'weather/wind': weather_wind,
  'system/alert': system_alert,
  'system/battery': system_battery,
  'system/bell': system_bell,
  'system/bluetooth': system_bluetooth,
  'system/cpu': system_cpu,
  'system/download': system_download,
  'system/fan': system_fan,
  'system/gps': system_gps,
  'system/heartbeat': system_heartbeat,
  'system/humidity': system_humidity,
  'system/lock': system_lock,
  'system/memory': system_memory,
  'system/mic': system_mic,
  'system/ota': system_ota,
  'system/sdcard': system_sdcard,
  'system/signal': system_signal,
  'system/speaker': system_speaker,
  'system/sync': system_sync,
  'system/thermometer': system_thermometer,
  'system/unlock': system_unlock,
  'system/usb': system_usb,
  'system/wifi': system_wifi,
  'pomodoro/breathe': pomodoro_breathe,
  'pomodoro/campfire': pomodoro_campfire,
  'pomodoro/candle': pomodoro_candle,
  'pomodoro/checklist': pomodoro_checklist,
  'pomodoro/coffee': pomodoro_coffee,
  'pomodoro/desk-lamp': pomodoro_desk_lamp,
  'pomodoro/fireworks': pomodoro_fireworks,
  'pomodoro/flip-clock': pomodoro_flip_clock,
  'pomodoro/focus-ring': pomodoro_focus_ring,
  'pomodoro/hourglass': pomodoro_hourglass,
  'pomodoro/letter': pomodoro_letter,
  'pomodoro/nap': pomodoro_nap,
  'pomodoro/notebook': pomodoro_notebook,
  'pomodoro/pencil': pomodoro_pencil,
  'pomodoro/plant': pomodoro_plant,
  'pomodoro/stretch': pomodoro_stretch,
  'pomodoro/tea': pomodoro_tea,
  'pomodoro/timer-beep': pomodoro_timer_beep,
  'pomodoro/tomato': pomodoro_tomato,
  'pomodoro/water': pomodoro_water,
  'transitions/bars': transitions_bars,
  'transitions/blinds': transitions_blinds,
  'transitions/checker': transitions_checker,
  'transitions/circle-out': transitions_circle_out,
  'transitions/crt': transitions_crt,
  'transitions/diamond': transitions_diamond,
  'transitions/dissolve': transitions_dissolve,
  'transitions/fade-center': transitions_fade_center,
  'transitions/iris': transitions_iris,
  'transitions/pixels': transitions_pixels,
  'transitions/radar': transitions_radar,
  'transitions/scramble': transitions_scramble,
  'transitions/slide-up': transitions_slide_up,
  'transitions/spiral': transitions_spiral,
  'transitions/wipe': transitions_wipe
}, {
  eyes: { value: legacyEyes }, 'happy-squint': { value: legacyHappySquint }
}));

export const categories = Object.freeze([...new Set(Object.keys(effects).map(id => id.split('/')[0]))]);
export const catalog = Object.freeze(Object.values(effects).map(({ meta }) => meta));
