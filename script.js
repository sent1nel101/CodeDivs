$(function () {
        
    $('.toggleButton').on('click', function(){
        $(this).toggleClass('selected');
    })

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

    //set the content of the iframe
    $("#html-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#css-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#javascript-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    function updateContent(){
    $('iframe').contents().find("html").html('<style type="text/css" >' + $('#css-text-area').val() + '</style>' + $('#html-text-area').val());
    document.getElementById("output-text").contentWindow.eval($("#javascript-text-area").val())
    }


})