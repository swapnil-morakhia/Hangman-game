(function ($) {
    var commentForm = $('#form-comment');
    var newCommentInput = $('#phrase');
    var commentArea = $('#comment-area');
  
    commentForm.submit(function (event) {
      event.preventDefault();
      var currentLink = window.location.pathname.split('/');
      var gameId = currentLink[3];
      var newComment = newCommentInput.val();
      if (newComment) {
          var requestConfig = {
            method: 'POST',
            url: '/dashboard/comments',
            contentType: 'application/json',
            data: JSON.stringify({
              gameId: gameId,  
              comment: newComment
            })
          };
  
          $.ajax(requestConfig).then(function (responseMessage) {
            var newElement = $(responseMessage);
            commentArea.append(newElement);
          });
        
      }
    });
  })(window.jQuery);
