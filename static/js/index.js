$(document).ready(function() {
    $("#add_btn").click(function() {
        str = $("#input_box").val();
        html = $("<li>" + str + "</li>");
        
        $(html).click(function() {
            if ($(this).hasClass("clicked"))
                $(this).removeClass("clicked");
            else
                $(this).addClass("clicked");
        });
        
        $("#list").append(html);
    });

});
