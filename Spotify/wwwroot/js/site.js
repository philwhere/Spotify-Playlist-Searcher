// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
const GlobalUrlParams = new URLSearchParams(window.location.search);


function ShowLoader(message) {
    if ($('#loader').hasClass('hidden'))
        $('#loader').toggleClass('hidden');
    $('#loaderMessage').text(message);
}

function HideLoader() {
    if (!$('#loader').hasClass('hidden'))
        $('#loader').toggleClass('hidden');
}

function GetUrlParams() {
    const params = {};
    for (const param of GlobalUrlParams)
        params[param[0]] = param[1];
    return params;
}

function CalculateUnixInMsExpiry(expiresInSeconds) {
    return new Date().valueOf() + expiresInSeconds * 1000 - 1000; //- 1000 to get clock to start at 59:59
}

async function Delay(delayInMs) {
    return new Promise(resolve  => {
        setTimeout(() => {
            resolve(2);
        }, delayInMs);
    });
}