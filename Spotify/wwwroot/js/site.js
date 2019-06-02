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

function GetHashParams() {
    const params = {};
    let e,
        r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q))
        params[e[1]] = decodeURIComponent(e[2]);
    return params;
}

function GetUrlParams() {
    const params = {};
    for (const param of GlobalUrlParams)
        params[param[0]] = param[1];
    return params;
}

function GetAllParams() {
    const urlParams = GetUrlParams();
    const hashParams = GetHashParams();
    return Object.assign(urlParams, hashParams);
}

function CalculateUnixInMsExpiry(expiresInSeconds) {
    return new Date().valueOf() + expiresInSeconds * 1000 - 1000; //- 1000 to get clock to start at 59:59
}