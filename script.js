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


    var htmlEditor = document.getElementById("html-text-area");
       
    htmlEditor.addEventListener("keyup", function() {
        localStorage.setItem("HtmlTextEditorData", htmlEditor.value) 
         });
    if (window.localStorage["HtmlTextEditorData"]) {
        htmlEditor.value = localStorage.getItem("HtmlTextEditorData", htmlEditor) ;
    } 

    var cssEditor = document.querySelector("#css-text-area");
    cssEditor.addEventListener("keyup", function() {
        localStorage.setItem("CssTextEditorData", cssEditor.value) 
         });
    if (window.localStorage["CssTextEditorData"]) {
        cssEditor.value = localStorage.getItem("CssTextEditorData", cssEditor) ;
    } 

    var javascriptEditor = document.querySelector("#javascript-text-area");
    javascriptEditor.addEventListener("keyup", function() {
        localStorage.setItem("JavascriptTextEditorData", javascriptEditor.value) 
         });
    if (window.localStorage["JavascriptTextEditorData"]) {
        javascriptEditor.value = localStorage.getItem("JavascriptTextEditorData", javascriptEditor) ;
    } 



    // create a download file of the textareas
   /*   function download(){
        var fullText = [];
        var htmlText = document.getElementById("html-text-area").value;
        var cssText = document.getElementById("css-text-area").value;
        var javascriptText = document.getElementById("javascript-text-area").value;
        fullText = [htmlText, cssText, javascriptText]
        var blob = new Blob([fullText], { type: "text/plain"});
        var anchor = document.createElement("a");
        anchor.download = "code-div.txt";
        anchor.href = window.URL.createObjectURL(blob);
        anchor.target ="_blank";
        anchor.style.display = "none"; // just to be safe!
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }  */


    $(function() {
        $('#saveToFile').click(function(e) {
          var data = document.getElementById('html-text-area').value + document.getElementById('css-text-area').value + document.getElementById('javascript-text-area').value;
          var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(data);
          var el = e.currentTarget;
          el.href = data;
          el.target = '_blank';
          el.download = 'code-divs.txt';
        });
      });


})