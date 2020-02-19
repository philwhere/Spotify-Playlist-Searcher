//var GlobalCounting;


//function GetTimeRemaining(endTime) {
//    const t = Date.parse(endTime) - Date.parse(new Date());
//    const seconds = Math.floor(t / 1000 % 60);
//    const minutes = Math.floor(t / 1000 / 60 % 60);
//    const hours = Math.floor(t / (1000 * 60 * 60) % 24);
//    const days = Math.floor(t / (1000 * 60 * 60 * 24));
//    return {
//        "total": t,
//        "days": days,
//        "hours": hours,
//        "minutes": minutes,
//        "seconds": seconds
//    };
//}

//function InitializeClock(id, endTime) {
//    const clock = document.getElementById(id);
//    const countdownDisplaySpan = clock.querySelector("#countdownDisplay");
//    function updateClock() {
//        const t = GetTimeRemaining(endTime);
//        const minutes = `0${t.minutes}`.slice(-2);
//        const seconds = `0${t.seconds}`.slice(-2);
//        countdownDisplaySpan.innerHTML = `${minutes}:${seconds}`;

//        if (t.total <= 0)
//            countdownDisplaySpan.innerHTML = "00:00";
//    }
//    updateClock(); // run function once at first to avoid delay
//    GlobalCounting = setInterval(updateClock, 1000);
//}

//function ResetClock(id, endTime) {
//    clearInterval(GlobalCounting);
//    InitializeClock(id, endTime);
//}
