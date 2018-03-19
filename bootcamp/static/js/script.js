$(document).ready(function(){
	
	$('.chat_body').hide();
	$('.msg_wrap').hide();
	
	$('.chat_head').click(function(){
		$('.chat_body').slideToggle('slow');
	});


	
	$('.msg_head').click(function(){
		$('.msg_wrap').slideToggle('slow');
	});
	
	$('.close').click(function(){
		$('.msg_box').hide();
		alert("clcik");
	});
	
	$('.user').click(function(){
		alert("click");
		$('.msg_wrap').show();
		$('.msg_box').show();
	});
	
	$('textarea').keypress(
    function(e){
        if (e.keyCode == 13) {
            e.preventDefault();
            var msg = $(this).val();
			$(this).val('');
			if(msg!='')
			$('<div class="msg_b">'+msg+'</div>').insertBefore('.msg_push');
			$('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
        }
    });


	
});