$(function () {
        var maxBlockSize = 256 * 1024;//Each file will be split in 256 KB.
        var numberOfBlocks = 1;
        var selectedFile = null;
        var currentFilePointer = 0;
        var totalBytesRemaining = 0;
        var blockIds = new Array();
        var blockIdPrefix = "block-";
        var submitUri = null;
        var bytesUploaded = 0;
    var page_title = $(document).attr("title");
    var uploadProgress = new Object();
    // WebSocket connection management block.
    // Correctly decide between ws:// and wss://
    

    function hide_stream_update() {
        $(".stream-update").hide();
        $(".stream-update .new-posts").text("");
        $(document).attr("title", page_title);
    }

    $("body").keydown(function (evt) {
        var keyCode = evt.which?evt.which:evt.keyCode;
        if (evt.ctrlKey && keyCode == 80) {
            $(".btn-compose").click();
            return false;
        }
    });

    $("#compose-form textarea[name='post']").keydown(function (evt) {
        var keyCode = evt.which?evt.which:evt.keyCode;
        if (evt.ctrlKey && (keyCode == 10 || keyCode == 13)) {
            $(".btn-post").click();
        }
    });

    (function () {
        //if ($(".compose").hasClass("composing")) {
        //    $(".compose").removeClass("composing");
        //    $(".compose").slideUp(); 
        //}
        //else {
            $(".compose").addClass("composing");
            $(".compose textarea").val("");
            $(".compose").slideDown(400, function () {
                $(".compose textarea").focus();
            });
        //}
    });

    $(".btn-cancel-compose").click(function () {
        //$(".compose").slideUp();
    });

    $(".btn-post").click(function () {

        var selectedFiles = $('.upload_post').prop('files');
        if(selectedFiles.length === 0){
            alert("wrong");
        }else{

        var last_feed = $(".stream li:first-child").attr("feed-id");
        if (last_feed == undefined) {
            last_feed = "0";
        }
        $("#compose-form input[name='last_feed']").val(last_feed);
        $.ajax({
            url: '/feeds/createpost/',
            data: $("#compose-form").serialize(),
            type: 'post',
            cache: false,
            success: function (data) {

                $("ul.stream").prepend(data.html);
                //$(".compose").slideUp();
                $(".compose").removeClass("composing");
                hide_stream_update();
                startUploadProcess(data.post_id);

            }
        });
    }
    });

    function startUploadProcess(post_id){
    var selectedFiles = $(".upload_post").prop('files');
    formItem = $(".upload_post").parent()
    $.each(selectedFiles, function(index, item){

        var myFile = verifyFileIsImageMovieAudio(item)
        if (myFile){
            uploadFile(myFile, post_id)
        } else {
            // alert("Some files are invalid uploads.")
            alert("Cannot Upload without selecting a file");
        }
    })
    $(".upload_post").val('');



}

    $("ul.stream").on("click", ".like", function () {
        var li = $(this).closest("li");
        var feed = $(li).attr("feed-id");
        var csrf = $(li).attr("csrf");
        $.ajax({
            url: '/feeds/like/',
            data: {
                'feed': feed,
                'csrfmiddlewaretoken': csrf
            },
            type: 'post',
            cache: false,
            success: function (data) {
                if ($(".like", li).hasClass("unlike")) {
                    $(".like", li).removeClass("unlike");
                    $(".like .text", li).text("Like");
                }
                else {
                    $(".like", li).addClass("unlike");
                    $(".like .text", li).text("Unlike");
                }
                $(".like .like-count", li).text(data);
            }
        });
        return false;
    });

    $("ul.stream").on("click", ".comment", function () {
        var post = $(this).closest(".post");
        if ($(".comments", post).hasClass("tracking")) {
            $(".comments", post).slideUp();
            $(".comments", post).removeClass("tracking");
        }
        else {
            $(".comments", post).show();
            $(".comments", post).addClass("tracking");
            $(".comments input[name='post']", post).focus();
            var feed = $(post).closest("li").attr("feed-id");
            $.ajax({
                url: '/feeds/comment/',
                data: { 'feed': feed },
                cache: false,
                beforeSend: function () {
                    $("ol", post).html("<li class='loadcomment'><img src='/static/img/loading.gif'></li>");
                },
                success: function (data) {
                    $("ol", post).html(data);
                    $(".comment-count", post).text($("ol li", post).not(".empty").length);
                }
            });
        }
        return false;
    });

    $("ul.stream").on("keydown", ".comments input[name='post']", function (evt) {
        var keyCode = evt.which?evt.which:evt.keyCode;
        if (keyCode == 13) {
            var form = $(this).closest("form");
            var container = $(this).closest(".comments");
            var input = $(this);
            $.ajax({
                url: '/feeds/comment/',
                data: $(form).serialize(),
                type: 'post',
                cache: false,
                beforeSend: function () {
                    $(input).val("");
                },
                success: function (data) {
                    $("ol", container).html(data);
                    var post_container = $(container).closest(".post");
                    $(".comment-count", post_container).text($("ol li", container).length);
                }
            });
            return false;
        }
    });

    var load_feeds = function () {
        if (!$("#load_feed").hasClass("no-more-feeds")) {
            var page = $("#load_feed input[name='page']").val();
            var next_page = parseInt($("#load_feed input[name='page']").val()) + 1;
            $("#load_feed input[name='page']").val(next_page);
            $.ajax({
                url: '/feeds/load/',
                data: $("#load_feed").serialize(),
                cache: false,
                beforeSend: function () {
                    $(".load").show();
                },
                success: function (data) {
                    if (data.length > 0) {
                        $("ul.stream").append(data)
                    }
                    else {
                        $("#load_feed").addClass("no-more-feeds");
                    }
                },
                complete: function () {
                    $(".load").hide();
                }
            });
        }
    };

    $("#load_feed").bind("enterviewport", load_feeds).bullseye();

    $(".stream-update a").click(function () {
        var last_feed = $(".stream li:first-child").attr("feed-id");
        var feed_source = $("#feed_source").val();
        $.ajax({
            url: '/feeds/load_new/',
            data: {
                'last_feed': last_feed,
                'feed_source': feed_source
            },
            cache: false,
            success: function (data) {
                $("ul.stream").prepend(data);
            },
            complete: function () {
                hide_stream_update();
            }
        });
        return false;
    });

    $("input,textarea").attr("autocomplete", "off");

    $("ul.stream").on("click", ".remove-feed", function () {
        var li = $(this).closest("li");
        var feed = $(li).attr("feed-id");
        var csrf = $(li).attr("csrf");
        $.ajax({
            url: '/feeds/remove/',
            data: {
                'feed': feed,
                'csrfmiddlewaretoken': csrf
            },
            type: 'post',
            cache: false,
            success: function (data) {
                $(li).fadeOut(400, function () {
                    $(li).remove();
                });
            }
        });
    });

    $("#compose-form textarea[name='post']").keyup(function () {
        $(this).count(255);
    });

    function update_feeds () {
        var first_feed = $(".stream li:first-child").attr("feed-id");
        var last_feed = $(".stream li:last-child").attr("feed-id");
        var feed_source = $("#feed_source").val();

        if (first_feed != undefined && last_feed != undefined) {
            $.ajax({
                url: '/feeds/update/',
                data: {
                    'first_feed': first_feed,
                    'last_feed': last_feed,
                    'feed_source': feed_source
                },
                cache: false,
                success: function (data) {
                    $.each(data, function(id, feed) {
                            var li = $("li[feed-id='" + id + "']");
                            $(".like-count", li).text(feed.likes);
                            $(".comment-count", li).text(feed.comments);
                    });
                },
            });
        }
    };

    function track_comments () {
        $(".tracking").each(function () {
            var container = $(this);
            var feed = $(this).closest("li").attr("feed-id");
            $.ajax({
                url: '/feeds/track_comments/',
                data: {'feed': feed},
                cache: false,
                success: function (data) {
                    if (data != 0) {
                        $("ol", container).html(data);
                        var post_container = $(container).closest(".post");
                        $(".comment-count", post_container).text($("ol li", container).length);
                    }
                }
            });
        });
    };

    function check_new_feeds () {
        var last_feed = $(".stream li:first-child").attr("feed-id");
        var feed_source = $("#feed_source").val();
        if (last_feed != undefined) {
            $.ajax({
                url: '/feeds/check/',
                data: {
                    'last_feed': last_feed,
                    'feed_source': feed_source
                },
                cache: false,
                success: function (data) {
                    if (parseInt(data) > 0) {
                        $(".stream-update .new-posts").text(data);
                        $(".stream-update").show();
                        $(document).attr("title", "(" + data + ") " + page_title);
                    }
                },
            });
        }
    };




getFile();
    // setup session cookie data. This is Django-related
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    // end session cookie data setup. 



// declare an empty array for potential uploaded files
var fileItemList = []

// auto-upload on file input change.



function verifyFileIsImageMovieAudio(file){
    // verifies the file extension is one we support.
    var extension = file.name.split('.').pop().toLowerCase(); //file.substr( (file.lastIndexOf('.') +1) );
    switch(extension) {
        case 'jpg':
        case 'png':
        case 'gif':
        case 'jpeg':
        case 'dng':
        case 'nef':
            return file  
        case 'mkv':
        case 'mp4':
        case 'mpeg4':
        case 'avi':
            return file
        case 'mp3':
            return file
        default:
            notAllowedFiles.push(file)
            return null
    }
};



function fileUploadComplete(fileItem, policyData){
    data = {
        uploaded: true,
        fileSize: fileItem.size,
        file: policyData.file_id,

    }
    $.ajax({
        method:"POST",
        data: data,
        url: "/api/files/complete/",
        success: function(data){
            displayItems(fileItemList)
        },
        error: function(jqXHR, textStatus, errorThrown){ 
            // alert("An error occured, please refresh the page.")
        }
    })
}

function displayItems(fileItemList){
    var itemList = $('.item-loading-queue')
    itemList.html("")
    $.each(fileItemList, function(index, obj){
        
        var item = obj.file
        var id_ = obj.id
        var order_ = obj.order
        var progress = obj.progress
        console.log(progress)
        var html_ = "<div class=\"progress\">" + 
          "<div class=\"progress-bar\" role=\"progressbar\" style='width:" + progress + "%' aria-valuenow='" + progress + "' aria-valuemin=\"0\" aria-valuemax=\"100\"></div></div>"
        itemList.append("<div>" + order_ + ") " + item.name + "<a href='#' class='srvup-item-upload float-right' data-id='" + id_ + ")'>X</a> <br/>" + html_ + "</div><hr/>")

    })
}


function uploadFile(fileItem, post_id){
        var newLoadingItem;
        var data;
     


        // get AWS upload policy for each file uploaded through the POST method
        // Remember we're creating an instance in the backend so using POST is
        // needed.
        $.ajax({
            method:"POST",
            data: {
                filename: fileItem.name,
                post_id: post_id
            },
            url: "/api/files/policy/",
            success: function(data){
                    data = data;
                    upload_url = data.upload_url
                    signature = data.sas_token
                    handleFileSelect(fileItem, data);
                    
            },
            error: function(data){
                alert("An error occured, please try again later")
            }
        }).done(function(){

            
            
        



        })
    }


    function handleFileSelect(e, data) {
        console.log(data.upload_url);
    maxBlockSize = 256 * 1024;
    currentFilePointer = 0;
    totalBytesRemaining = 0;
    selectedFile = e;
    // $("#output").show();
    // $("#fileName").text(selectedFile.name);
    // $("#fileSize").text(selectedFile.size);
    // $("#fileType").text(selectedFile.type);
    var fileSize = selectedFile.size;
    if (fileSize < maxBlockSize) {
        maxBlockSize = fileSize;
        console.log("max block size = " + maxBlockSize);
    }
    totalBytesRemaining = fileSize;
    console.log("remaining bytes" + totalBytesRemaining);
    if (fileSize % maxBlockSize == 0) {
        numberOfBlocks = fileSize / maxBlockSize;
    } else {
        numberOfBlocks = parseInt(fileSize / maxBlockSize, 10) + 1;
    }
    console.log("total blocks = " + numberOfBlocks);
    var baseUrl = data.upload_url;
    var indexOfQueryStart = baseUrl.indexOf("?");
    submitUri = baseUrl.substring(0, indexOfQueryStart) + '?' + data.sas_token;
    console.log(submitUri);
    uploadFileInBlocks();
    newLoadingItem = {
        file: e,
        id: data.file_id,
        order: fileItemList.length + 1,
        progress: 0
    }
    fileItemList.push(newLoadingItem)

}

    var reader = new FileReader();

    reader.onloadend = function (evt) {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        var uri = submitUri + '&comp=block&blockid=' + blockIds[blockIds.length - 1];
        var requestData = new Uint8Array(evt.target.result);
            $.ajax({
                url: uri,
                type: "PUT",
                data: requestData,
                processData: false,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
                    //xhr.setRequestHeader('Content-Length', requestData.length);
                },
                success: function (data, status) {
                    console.log(data);
                    console.log(status);
                    bytesUploaded += requestData.length;
                    var percentComplete = ((parseFloat(bytesUploaded) / parseFloat(selectedFile.size)) * 100).toFixed(2);
                    // $("#fileUploadProgress").text(percentComplete + " %");
                    
                    for(var item in fileItemList){
                        fileItemList[item].progress = percentComplete;
                        console.log(fileItemList[item].progress);
                        displayItems(fileItemList);
                    }
                    
                    uploadFileInBlocks();
                },
                error: function(xhr, desc, err) {
                    console.log(desc);
                    console.log(err);
                }
            });
        }
    };

     function uploadFileInBlocks() {
            if (totalBytesRemaining > 0) {
                console.log("current file pointer = " + currentFilePointer + " bytes read = " + maxBlockSize);
                var fileContent = selectedFile.slice(currentFilePointer, currentFilePointer + maxBlockSize);
                var blockId = blockIdPrefix + pad(blockIds.length, 6);
                console.log("block id = " + blockId);
                blockIds.push(btoa(blockId));
                reader.readAsArrayBuffer(fileContent);
                currentFilePointer += maxBlockSize;
                totalBytesRemaining -= maxBlockSize;
                
                

                console.log("rached" + totalBytesRemaining + "max" + maxBlockSize);
                if (totalBytesRemaining < maxBlockSize) {
                    console.log("looping to upload");
                    maxBlockSize = totalBytesRemaining;
                    
                }
            } else {
                console.log("reached commit");
                commitBlockList();
            }
        }

    function commitBlockList() {
            var uri = submitUri + '&comp=blocklist';
            console.log(uri);
            var requestBody = '<?xml version="1.0" encoding="utf-8"?><BlockList>';
            for (var i = 0; i < blockIds.length; i++) {
                requestBody += '<Latest>' + blockIds[i] + '</Latest>';
            }
            requestBody += '</BlockList>';
            console.log(requestBody);
            $.ajax({
                url: uri,
                type: "PUT",
                data: requestBody,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('x-ms-blob-content-type', selectedFile.type);
                    xhr.setRequestHeader('Content-Length', requestBody.length);
                },
                success: function (data, status) {
                    console.log(data);
                    console.log(status);
                    blockIds = new Array();
                },
                error: function (xhr, desc, err) {
                    console.log(desc);
                    console.log(err);
                    blockIds = new Array();
                }
            });
 
        }
        function pad(number, length) {
            var str = '' + number;
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        }

//     function constructGetPolicyData(policyData, contType) {

//     var contentType = contType
//     var url = policyData.url
//     var filename = policyData.filename
//     var repsonseUser = policyData.user

//     // var keyPath = 'www/' + repsonseUser + '/' + filename
//     var keyPath = policyData.file_bucket_path
//     var fd = new FormData()
//     fd.append('key', keyPath + filename);
//     fd.append('acl','private');
//     fd.append('Content-Type', contentType);
//     fd.append("AWSAccessKeyId", policyData.key)
//     fd.append('Policy', policyData.policy);
//     fd.append('filename', filename);
//     fd.append('Signature', policyData.signature);
//     return fd
// }

    function getFile(){
        var policyData;
        var newLoadingItem;
        // get AWS upload policy for each file uploaded through the POST method
        // Remember we're creating an instance in the backend so using POST is
        // needed.


        $.ajax({
            method:"GET",
            data: {
                
            },
            url: "/api/files/policy/",
            success: function(data){
                    policyData = data
                    
                    
                       var fd = constructFormPolicyData(policyData, fileItem)

                        // use XML http Request to Send to AWS. 
                        var xhr = new XMLHttpRequest()


                    var s3 = new AWS.S3();
                    var params = {
                        Bucket: 'freemedianews',
                        Key: "a/3/3.mp4",
                        Expires: 60
                    };

                   
                     s3.getSignedUrl('getObject', params, function (err, url) {
                            if (err) {console.log(err, err.stack); }// an error occurred
                            else{
                                console.log(url);          
                                
                            }

                            
                    });
                },
            error: function(data){
                alert("An error occured, please try again later")
            }
        }).done(function(){
            // construct the needed data using the policy for AWS
            
            
            // var fd = constructGetPolicyData(policyData, policyData.type)

            // // use XML http Request to Send to AWS. 
            // var xhrr = new XMLHttpRequest()
            // alert(policyData.type);
         

            // construct callback for when uploading starts
            // xhr.upload.onloadstart = function(event){
            //     var inLoadingIndex = $.inArray(fileItem, fileItemList)
            //     if (inLoadingIndex == -1){
            //         // Item is not loading, add to inProgress queue
            //         newLoadingItem = {
            //             file: fileItem,
            //             id: policyData.file_id,
            //             order: fileItemList.length + 1
            //         }
            //         fileItemList.push(newLoadingItem)
            //       }
            //     fileItem.xhr = xhr
            // }

            // // Monitor upload progress and attach to fileItem.
            // xhr.upload.addEventListener("progress", function(event){
            //     if (event.lengthComputable) {
            //      var progress = Math.round(event.loaded / event.total * 100);
            //         fileItem.progress = progress
            //         displayItems(fileItemList)
            //     }
            // })

            // xhr.upload.addEventListener("load", function(event){
            //     console.log("Complete")
            //     // handle FileItem Upload being complete.
            //     // fileUploadComplete(fileItem, policyData)

            // })
            // alert(policyData);

            // xhrr.open('GET', policyData.url , true);
            // xhrr.send(fd);
            
        })
    }


});




