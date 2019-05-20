var GlobalCounting;


function GetTimeRemaining(endtime) {
    const t = Date.parse(endtime) - Date.parse(new Date());
    const seconds = Math.floor(t / 1000 % 60);
    const minutes = Math.floor(t / 1000 / 60 % 60);
    const hours = Math.floor(t / (1000 * 60 * 60) % 24);
    const days = Math.floor(t / (1000 * 60 * 60 * 24));
    return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    };
}

function InitializeClock(id, endTime) {
    const clock = document.getElementById(id);
    const countdownDisplaySpan = clock.querySelector('.countdownDisplay');
    function UpdateClock() {
        const t = GetTimeRemaining(endTime);
        const minutes = ('0' + t.minutes).slice(-2);
        const seconds = ('0' + t.seconds).slice(-2);
        countdownDisplaySpan.innerHTML = `${minutes}:${seconds}`;

        if (t.total <= 0)
            countdownDisplaySpan.innerHTML = '00:00';
    }
    UpdateClock(); // run function once at first to avoid delay
    GlobalCounting = setInterval(UpdateClock, 1000);
}

function ResetClock(id, endTime) {
    clearInterval(GlobalCounting);
    InitializeClock(id, endTime);
}
