function add_rule(src) {
    console.log(src);
    // Insert the default rules
    var prefix = $('.row.rule').last().data('prefix') + 1;
    var rule = $(src).closest('.ruleset').find('.row.defaults')
        .clone()
        .removeClass('defaults')
        .addClass('rule')
        .attr('data-prefix', prefix);

    // Replace {prefix} with the subsequential number
    rule.html(
        rule.html()
            .replace(/{prefix}/g, prefix)
    );

    // Remove the "defaults" label
    rule.find('.label').remove();

    // Make the keyword input visible again
    rule.find('.keyword').removeAttr('style');
    rule.find('.delete').removeAttr('style');

    // Insert the new row into the rules table
    rule.insertBefore($(src).closest('.ruleset').find('.row.add'));
    rule.find('.keyword input').focus().keypress(keyword_keypress);
    rule.find('input[type=checkbox]').click(checkbox_click);
}

function keyword_keypress(e) {
    if ((e.which || e.keyCode || e.charCode) == 13) {
        add_rule();
        return false;
    }
}

function checkbox_click(e) {
    console.log(e);
    if (e.shiftKey) {
        if ($(this).closest('.row').hasClass('defaults')) {
            $('.' + $(this).closest('div').attr('class'))
                .find('input[type=checkbox]')
                .prop('checked', this.checked);
        }
    }
}

function delete_rule(e) {
    var ruleset = $(e).closest('.ruleset');
    $(e).closest('.rule').remove();
    if (!ruleset.children('.rule').length) {
        add_rule(ruleset);
    }
}

$(function() {
    $('.keyword input').keypress(keyword_keypress);
    $('input[type=checkbox]').click(checkbox_click);
});
