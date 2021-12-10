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

})