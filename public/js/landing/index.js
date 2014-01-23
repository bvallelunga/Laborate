$(function() {
    $("#slider")
        .html(Array($(".slide").length).join("<div><div></div></div>"))
        .vAlign();


    $("#slider").on("click", "div", function() {
        var slide = $(".slide").eq($(this).index());

        $('html, body').animate({
            scrollTop: slide.offset().top + slide.outerHeight(true)
        }, 500);
    });

    $('.slide').each(function() {
        $(this).waypoint(function(direction) {
            var selected = $(this);

            if (direction === "up") {
                selected = selected.prev();
            }

            if (!selected.length) {
                selected = $(this);
            }

            $("#slider > div")
                .removeClass("active")
                .eq(selected.index())
                .addClass("active");
        }, {
            offset: $(this).height()/.5
        });
    });

    CodeMirror.modeURL = "/codemirror/mode/%N/%N.js";

    $(".editor").each(function() {
        var editor = CodeMirror.fromTextArea(this, {
            lineNumbers: true,
            lineWrapping: false,
            matchBrackets: true,
            matchTags: true,
            tabMode: "indent",
            theme: "laborate",
            indentUnit: 4,
            indentWithTabs: true,
            smartIndent: true,
            autofocus: true,
            dragDrop: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
            highlightSelectionMatches: false,
            styleSelectedText: false,
            styleActiveLine: false
        });

        $(this).parent().height($(this).parent().parent().height() - $("#backdrop-header").outerHeight(true));
        editor.setOption("mode", "text/x-java");
        editor.refresh();
        CodeMirror.autoLoadMode(editor, "clike");
    });
});

$(window).load(function() {
    $("#backdrop-img").fadeIn(350);
});
