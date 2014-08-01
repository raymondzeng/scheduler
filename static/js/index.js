$(document).ready(function() {
    $("#input_box").focus();
    $('#input_box').keypress(function (e) {
        if (e.which == 13) {
            add_item($(this).val());
            e.preventDefault();
        }
    });
    
    $("#add_btn").click(function() {
        add_item($("#input_box").val());
    });
});


function add_item(str) {
    $("#input_box").val("");
    task_str = '<span class="task_str">' + str + '</span>';

    btn = '<input type="button" class="button" value="X">';
    html = $("<li>" + task_str + btn + "</li>");
        
    $("#list").append(html);
    
    add_click_listeners();
}

function add_click_listeners() {
    $(".task_str").click(function() {
        if ($(this).hasClass("clicked"))
            $(this).removeClass("clicked");
        else
            $(this).addClass("clicked");
    });
    
    $("input[value='X']").click(function() {
        console.log("x");
    });
}
