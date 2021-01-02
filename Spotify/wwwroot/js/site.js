// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
const GlobalUrlParams = new URLSearchParams(window.location.search);


function ShowLoader(message) {
    if ($("#loader").hasClass("hidden"))
        $("#loader").toggleClass("hidden");
    $("#loaderMessage").text(message);
}

function HideLoader() {
    if (!$("#loader").hasClass("hidden"))
        $("#loader").toggleClass("hidden");
}

function GetUrlParams() {
    const params = {};
    for (const param of GlobalUrlParams)
        params[param[0]] = param[1];
    return params;
}

function CalculateExpiryInUnixMs(expiresInSeconds) {
    return new Date().valueOf() + expiresInSeconds * 1000 - 1000; //- 1000 to get clock to start at 59:59
}

function PrettyPrintElapsedTime(elapsedSeconds) {
    const seconds = Math.floor(elapsedSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60);

    const minutesAfterHours = Math.floor((seconds - (hours * 3600)) / 60);
    const secondsAfterMinutes = seconds - (hours * 3600) - (minutesAfterHours * 60);

    const hoursMessage = `${hours} ${hours === 1 ? "hour" : "hours"}`;
    const minutesMessage = `${minutesAfterHours} ${minutesAfterHours === 1 ? "minute" : "minutes"}`;
    const secondsMessage = `${secondsAfterMinutes} ${secondsAfterMinutes === 1 ? "second" : "seconds"}`;

    if (hours > 0)
        return `${hoursMessage} ${minutesMessage}`;

    if (minutes > 0)
        return `${minutesMessage}`;

    return secondsMessage;
}