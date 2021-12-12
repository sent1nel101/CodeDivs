 // emmet trial
 emmet.require('textarea').setup({
    pretty_break: true, // enable formatted line breaks (when inserting 
                        // between opening and closing tag) 
    use_tab: true       // expand abbreviations by Tab key
});

$(function () {
   
// create toggles to HIDE and SHOW input and output panels   
// set the visual styles on panel buttons to show which panels are active.
    $('.toggleButton').on('click', function(){
        $(this).toggleClass('selected');
    })
    
// toggle the horizontal and vertical view of panels and set visual style of the toggler
$('#toggler').on('click', function(){
    $('.contentWrapper').toggleClass('wrapperToggled')
    $('#toggler').toggleClass('toggled')
})

// toggle display of input and output panels
    $('#htmlBtn').on('click', function(){
        $('.html').toggleClass('hidden')
    })
    $('#cssBtn').on('click', function(){
        $('.css').toggleClass('hidden')
    })
    $('#javascriptBtn').on('click', function(){
        $('.javascript').toggleClass('hidden')
    })
    $('#outputBtn').on('click', function(){
        $('.output').toggleClass('hidden')
    })

// run updateContent() when values in the input areas change
    $("#html-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#css-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#javascript-text-area").on('change keyup paste', function(){
        updateContent()                
    })

//create updateContent() to change the content of the iframe with input values 
    function updateContent(){
    $('iframe').contents().find("html").html('<style type="text/css" >' + $('#css-text-area').val() + '</style>' + $('#html-text-area').val());
    document.getElementById("output-text").contentWindow.eval($("#javascript-text-area").val())
    }

    // create function to update panels on page load
    window.onload = function(){
        updateContent()
    }

// connect textareas to local storage for save feature on page refresh
// pull  HTML values from local storage when the page loads and store in local storage on keyup
    var htmlEditor = document.getElementById("html-text-area");
       
    htmlEditor.addEventListener("keyup", function() {
        localStorage.setItem("HtmlTextEditorData", htmlEditor.value) 
         });
    if (window.localStorage["HtmlTextEditorData"]) {
        htmlEditor.value = localStorage.getItem("HtmlTextEditorData", htmlEditor) ;
    } 


// pull  CSS values from local storage when the page loads and store in local storage on keyup
    var cssEditor = document.querySelector("#css-text-area");
    cssEditor.addEventListener("keyup", function() {
        localStorage.setItem("CssTextEditorData", cssEditor.value) 
         });
    if (window.localStorage["CssTextEditorData"]) {
        cssEditor.value = localStorage.getItem("CssTextEditorData", cssEditor) ;
    } 


// pull  JavaScript values from local storage when the page loads and store in local storage on keyup
    var javascriptEditor = document.querySelector("#javascript-text-area");
    javascriptEditor.addEventListener("keyup", function() {
        localStorage.setItem("JavascriptTextEditorData", javascriptEditor.value) 
         });
    if (window.localStorage["JavascriptTextEditorData"]) {
        javascriptEditor.value = localStorage.getItem("JavascriptTextEditorData", javascriptEditor) ;
    } 

})