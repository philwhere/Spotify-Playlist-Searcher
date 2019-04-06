// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
function ShowLoader() {
    if ($('#loader').hasClass('hidden'))
        $('#loader').toggleClass('hidden');
}

function HideLoader() {
    if (!$('#loader').hasClass('hidden'))
        $('#loader').toggleClass('hidden');
}

const urlParams = new URLSearchParams(window.location.search);
