
var imgExtensions = ["jpg", "jpeg", "png"];

var stringeeClient;
stringeeClient = new StringeeClient();


let ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJTS3U5dW80cWdQWWVSWEYyMkZmMnFiVVg4SURaWW5lc1A1LTE1OTQyMjgwNzIiLCJpc3MiOiJTS3U5dW80cWdQWWVSWEYyMkZmMnFiVVg4SURaWW5lc1A1IiwiZXhwIjoxNTk2ODIwMDcyLCJ1c2VySWQiOiIxMiIsInVzZXJOYW1lIjoiTGUgVGhpIEIiLCJhdmF0YXIiOiJodHRwczovL3d3dy53M3NjaG9vbHMuY29tL3czaW1hZ2VzL2F2YXRhcjIucG5nIiwicmVzdF9hcGkiOnRydWUsImlhdCI6MTU5NDIyODA3Mn0.rA5K8LyqIb2PEgz8Xn-ipd5zVhzF5qGs8QaZeAeV15A";

stringeeClient.connect(ACCESS_TOKEN);

stringeeClient.on("connect", function (res) {
    renderLastConversationsAndMessages();
    realTimeUpdate();
    initEvents();
    let userId = getCurrentUserIdFromAccessToken(ACCESS_TOKEN);
    stringeeChat.getUsersInfo([userId], function (status, code, msg, users) {
        let user = users[0];
        if (!user) {
            let username = getCurrentUsernameFromAccessToken(ACCESS_TOKEN);
            let avatar = getCurrentUserAvatarFromAccessToken(ACCESS_TOKEN);
            let updateUserData = {
                display_name: username,
                avatar_url: avatar,
                email: ""
            }
            updateUserInfo(updateUserData)
        }
    })
});
stringeeClient.on("authen", function (res) {
    console.log(res);
});
stringeeClient.on("disconnect", function () { });

// kích hoạt sự kiện bên remote khi tin nhắn được gửi tới bên remote
// kích hoạt sự kiện khi thêm, xóa thành viên, sửa tên nhóm thành công
stringeeClient.on("chatmessage", function (msg) {
    let type = msg.type;
    let convIdRemote = msg.convId;
    let convId = localStorage.getItem("convId");
    renderUpdateConversations();
    if (type != 7) {
        if (convId == convIdRemote) {
            renderAppendReceivedMessage(msg)
        };
    }
})

// kích hoạt sự kiện khi người dùng remote nhận tin nhắn
// note: sự kiện được chạy khi hàm sendMesage chạy và bên remote cũng đang mở chat
stringeeClient.on("chatmessagestate", function (msg) {
    // to do
});

var stringeeChat;
stringeeChat = new StringeeChat(stringeeClient);

function initEvents() {
    // xử lý khi người dùng gửi tin nhắn dạng text hoặc đường link
    $(".write_msg").keypress(function (e) {
        sendTextMsg(e);
    });

    // xử lý khi người dùng gửi tin nhắn dạng file
    $("#file_input").on('change', function (e) {
        uploadFile(e);
    });

    // xử lý khi người dùng chọn user để nhắn tin
    $(".select_users").change(function () {
        if (!$("#isGroup").is(":checked")) {
            let userId = $(this).val();
            let nameGroup = userId;
            let isGroup = false;
            let isDistinct = true;
            createConversation([userId], nameGroup, isDistinct, isGroup);
        }
    });

    // xử lý khi người dùng thay đổi tích chọn checkbox tạo nhóm
    $('#isGroup').change(function () {
        if ($(this).is(":checked")) {
            $(".select_users").attr("multiple", true);
            $(".set_name_and_create_group").show();
        }
        else if ($(this).is(":not(:checked)")) {
            $(".select_users").attr("multiple", false);
            $(".set_name_and_create_group").hide();
        }
    });

    // xử lý khi người dùng nhấn button 'Tạo'
    $(".create_group_btn").click(function () {
        let groupName = $(".name_group").val();
        var userIds = $(".select_users option:selected").map(function (i, el) {
            return ($(el).val());
        });
        userIds = Array.from(userIds);
        if (userIds.length > 1) {
            let isGroup = true;
            let isDistinct = false;
            if (groupName) {
                createConversation(userIds, groupName, isDistinct, isGroup);
                $('#isGroup').prop('checked', false);
                $(".select_users").attr("multiple", false);
                $(".set_name_and_create_group").hide();
                $(".name_group").val("");
            } else {
                alert("Bạn chưa nhâp tên nhóm")
            }
        } else {
            alert("nhóm phải >= 2 người")
        }
    })
}

// Hàm tạo nhóm chat
function createConversation(userIds, nameGroup, isDistinct, isGroup) {
    var userIds = userIds;
    var options = {
        name: nameGroup,
        isDistinct: isDistinct,
        isGroup: isGroup
    };
    stringeeChat.createConversation(userIds, options, (status, code, message, conv) => {
        let convId = conv.id;
        localStorage.setItem("convId", convId);
        renderUpdateConversations();
        getLastMessagesAndRender(convId);
    });
}

// Hàm cập nhật thông tin một user
function updateUserInfo(data) {
    stringeeChat.updateUserInfo(data, function (res) {
        console.log(res)
    });
}

// Hàm xử lý khi người dùng gửi tin nhắn dạng text
function sendTextMsg(event) {
    if (event.which == 13 && !event.shiftKey) {
        let messageValue = $(".write_msg").val();
        let convId = localStorage.getItem("convId");
        let message = {
            content: messageValue,
            metadata: {
                key: 'value'
            }
        }
        let type = 1;
        let body = {
            type: type,
            convId: convId,
            message: message
        };
        $(event.target).val('');
        renderAppendSendMessageAndSend(body, type);
    }
}

// Hàm giải mã token
function decodeToken(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Hàm lấy userId hiện tại của người dùng đăng nhập
function getCurrentUserIdFromAccessToken(token) {
    let decodedToken = decodeToken(token);
    return decodedToken.userId;
}

// Hàm lấy userName hiện tại của người dùng đăng nhập
function getCurrentUsernameFromAccessToken(token) {
    let decodedToken = decodeToken(token);
    return decodedToken.userName;
}

// Hàm lấy avatar hiện tại của người dùng đăng nhập
function getCurrentUserAvatarFromAccessToken(token) {
    let decodedToken = decodeToken(token);
    return decodedToken.avatar;
}

// Hàm hiển thị các conversation gần nhất
function renderLastConversationsAndMessages() {
    var count = 25;
    var isAscending = false;
    stringeeChat.getLastConversations(count, isAscending, function (status, code, message, convs) {
        $(".inbox_chat").empty();
        let userId = getCurrentUserIdFromAccessToken(ACCESS_TOKEN);
        let convId = localStorage.getItem("convId");
        for (let i = 0; i < convs.length; i++) {
            let nameConv = convs[i].participants.filter(p => p.userId != userId);
            console.log(convs[i])
            stringeeChat.getUsersInfo([nameConv[0].userId], function (status, code, msg, users) {
                let user = users[0];
                $(".inbox_chat").append(
                    ` <div class="chat_list ${convId == convs[i].id ? "active" : ""}" key="${convs[i].id}">
                    <div class="chat_people">
                        <div class="chat_img"> <img src="${user.avatar}" alt="sunil"> </div>
                        <div class="chat_ib">
                            <h5>${convs[i].isGroup ? convs[i].name : user.name} <span class="chat_date"></span></h5>
                            <p>...</p>
                        </div>
                        </div>
                  </div>`
                );
                if (i == convs.length - 1)
                    $(".chat_list").click(function () {
                        $(".chat_list").removeClass("active");
                        $(this).addClass("active");
                        $(".msg_history").empty();
                        let key = $(this).attr("key");
                        localStorage.setItem("convId", key);
                        getLastMessagesAndRender(key);
                    });
            });
            if (i == 0) {
                localStorage.setItem("convId", convs[i].id);
                getLastMessagesAndRender(convs[i].id);
            }
        }
    });
}

// Hàm cập nhập hiển thị các conversation trên client
function renderUpdateConversations() {
    var count = 25;
    var isAscending = false;
    stringeeChat.getLastConversations(count, isAscending, function (status, code, message, convs) {
        $(".inbox_chat").empty();
        let userId = getCurrentUserIdFromAccessToken(ACCESS_TOKEN);
        let convId = localStorage.getItem("convId");
        for (let i = 0; i < convs.length; i++) {
            let nameConv = convs[i].participants.filter(p => p.userId != userId);
            stringeeChat.getUsersInfo([nameConv[0].userId], function (status, code, msg, users) {
                let user = users[0];
                if (user) {
                    $(".inbox_chat").append(
                        ` <div class="chat_list ${convId == convs[i].id ? "active" : ""}" key="${convs[i].id}">
                            <div class="chat_people">
                                <div class="chat_img"> <img src="${user.avatar}" alt="sunil"> </div>
                                <div class="chat_ib">
                                    <h5>${convs[i].isGroup ? convs[i].name : user.name} <span class="chat_date"></span></h5>
                                    <p>...</p>
                                </div>
                                </div>
                          </div>`
                    );
                }
                if (i == convs.length - 1) {
                    $(".chat_list").click(function () {
                        $(".chat_list").removeClass("active");
                        $(this).addClass("active");
                        $(".msg_history").empty();
                        let key = $(this).attr("key");
                        localStorage.setItem("convId", key);
                        getLastMessagesAndRender(key);
                    });
                }
            });
        }
    });
}

// Hàm lấy các tin nhắn mới nhất của một conversation
function getLastMessagesAndRender(convId) {
    var convId = convId;
    var count = 50;
    var isAscending = true;
    stringeeChat.getLastMessages(convId, count, isAscending, function (status, code, message, msgs) {
        $(".msg_history").empty();
        renderMessages(msgs);
    });
}

// Hàm hiển thị các tin nhắn của một conversation
function renderMessages(msgs) {
    let userId = getCurrentUserIdFromAccessToken(ACCESS_TOKEN);
    let msgsLength = msgs.length;
    for (let i = 0; i < msgsLength; i++) {
        let message = msgs[i];
        let messageHTML = "";
        let subMessageHTML = "";
        let messageContent = message.content.content ? message.content.content : message.content;
        let messagePhoto = message.content.photo;
        let messageFile = message.content.file;
        let messageVideo = message.content.video;
        let messageType = message.type;
        let sequence = message.sequence;
        let sender = message.sender;
        let isVisitor = (sender == userId);
        let isValidMessage = (messageContent || messagePhoto || messageFile || messageVideo);
        if (isValidMessage && messageType != 7) {
            switch (messageType) {
                case 1:
                    subMessageHTML = `<p>${message.content.content != null ? message.content.content : "."}</p>`;
                    break;
                case 2:
                    subMessageHTML = `<img src="${messagePhoto.filePath}">`;
                    break;
                case 3:
                    subMessageHTML = `<video width="320" height="240" controls><source src="${messageVideo.filePath}"></video>`;
                    break;
                case 5:
                    subMessageHTML = `<a href="${messageFile.filePath}">${messageFile.filename}</a>`;
                    break;
                case 6:
                    subMessageHTML = `<a href="${messageContent}" target="_blank">${messageContent}</a>`;
                    break;
                default:
                    break;
            }
            stringeeChat.getUsersInfo([sender], function (status, code, msg, users) {
                let user = users[0];
                if (isVisitor) {
                    messageHTML = `
                    <div class="outgoing_msg" data-msgseq="${sequence}">
                        <div class="sent_msg link_msg">
                            ${subMessageHTML}
                            <span class="time_date"> ${Common.formatDatetime(message.createdAt)}</span>
                        </div>
                    </div>
                    `
                } else {
                    messageHTML = `
                    <div class="incoming_msg" data-msgseq="${sequence}">
                        <div class="incoming_msg_img"> <img src="${user.avatar}" alt="sunil">
                        </div>
                        <div class="received_msg link_msg">
                            <div class="received_withd_msg">
                                ${subMessageHTML}
                                <span class="time_date"> ${Common.formatDatetime(message.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    `;
                }
                $(".msg_history").append(messageHTML);
                $(".mesgs_container").animate({ scrollTop: $(".mesgs_container").prop("scrollHeight") }, 0);
            });
        }
    }
}

// Hàm hiện thị thêm tin nhắn gửi vào cuối và gửi tin nhắn
function renderAppendSendMessageAndSend(body, type) {
    let message = body.message;
    let messageContent = message.content;
    let messagePhoto = message.photo;
    let messageFile = message.file;
    let messageVideo = message.video
    let subMessageHTML = "";
    switch (type) {
        case 1:
            subMessageHTML = `<p>${messageContent}</p>`;
            break;
        case 2:
            subMessageHTML = `<img src="${messagePhoto.filePath}">`;
            break;
        case 3:
            subMessageHTML = `<video width="320" height="240" controls><source src="${messageVideo.filePath}"></video>`;
            break;
        case 5:
            subMessageHTML = `<a href="${messageFile.filePath}">${messageFile.filename}</a>`;
            break;
        case 6:
            subMessageHTML = `<a href="${messageContent}" target="_blank">${messageContent}</a>`;
            break;
        default:
            break;
    };
    let _dataLog = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
    $(".msg_history").append(
        `
        <div class="outgoing_msg sending" data-msgseq="" data-log=${_dataLog}>
            <div class="sent_msg link_msg">
                ${subMessageHTML}
                <span class="time_date"> ${Common.formatDatetime((new Date).getTime())}</span>
            </div>
        </div>
        `
    );
    $(".mesgs_container").animate({ scrollTop: $(".mesgs_container").prop("scrollHeight") }, 1000);

    stringeeChat.sendMessage(body, function (status, code, message, msg) {
        if (msg.state == 2) {
            if ($(".outgoing_msg").find("[data-log=" + _dataLog + "]")) {
                $("*[data-log=" + _dataLog + "]").attr({
                    "data-msgseq": msg.sequence
                });
                $("*[data-log=" + _dataLog + "]").removeClass("sending");
                $("*[data-log=" + _dataLog + "]").addClass("delivered");
            } else {
                $(".outgoing_msg.sending").addClass("delivered").removeClass("sending");
            }
        }
        renderUpdateConversations();
    });
}

// Hàm hiện thị thêm tin nhắn nhận vào cuối
function renderAppendReceivedMessage(msg) {
    console.log(msg)
    let message = msg.message;
    let messageContent = message.content;
    let messagePhoto = message.photo;
    let messageFile = message.file;
    let messageVideo = message.video;
    let type = msg.type;
    let subMessageHTML = "";
    let sender = msg.from;
    console.log(sender)
    switch (type) {
        case 1:
            subMessageHTML = `<p>${messageContent}</p>`;
            break;
        case 2:
            subMessageHTML = `<img src="${messagePhoto.filePath}">`;
            break;
        case 3:
            subMessageHTML = `<video width="320" height="240" controls><source src="${messageVideo.filePath}"></video>`;
            break;
        case 5:
            subMessageHTML = `<a href="${messageFile.filePath}">${messageFile.filename}</a>`;
            break;
        case 6:
            subMessageHTML = `<a href="${messageContent}" target="_blank">${messageContent}</a>`;
            break;
        default:
            break;
    }
    stringeeChat.getUsersInfo([sender], function (status, code, m, users) {
        console.log(users)

        let avatar = users[0].avatar;
        messageHTML = `
        <div class="incoming_msg">
            <div class="incoming_msg_img"> <img src="${avatar}" alt="sunil">
            </div>
            <div class="received_msg link_msg">
                <div class="received_withd_msg">
                    ${subMessageHTML}
                    <span class="time_date"> ${Common.formatDatetime(msg.createdTime)}</span>
                </div>
            </div>
        </div>
        `;
        $(".msg_history").append(messageHTML);
        $(".mesgs_container").animate({ scrollTop: $(".mesgs_container").prop("scrollHeight") }, 1000);
        let data = {
            conversationId: msg.convId,
            sequence: msg.seq,
            createdAt: msg.createdTime
        }
        markMessageSeen(data);
    });
}

// Hàm xử lý khi người dùng gửi tin nhắn dạng file
async function uploadFile(event) {
    var inputFiles0 = event.target.files[0]
    var fileName = inputFiles0.name;
    var dotIndex = fileName.lastIndexOf(".") + 1;
    var inputFileExtension = fileName.substr(dotIndex, fileName.length).toLowerCase();
    if (imgExtensions.includes(inputFileExtension)) {
        var formData = new FormData();
        formData.set("file", inputFiles0);
        if (inputFiles0) {
            let filePath = await saveFileToServer(formData);
            var message = {
                "content": "",
                "metadata": "",
                "photo": {
                    "filePath": filePath, // image's url
                    "thumbnail": "", // thumbnail's url
                    "ratio": "" // image's ratio
                }
            };
            var convId = localStorage.getItem("convId");
            var type = 2;
            var body = { convId: convId, message: message, type: type };
            renderAppendSendMessageAndSend(body, type);
        }
    }
}

// Hàm lưu trữ tin nhắn tới server
function saveFileToServer(data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            headers: {
                "X-STRINGEE-AUTH": ACCESS_TOKEN
            },
            url: "https://api.stringee.com/v1/file/upload?uploadType=multipart",
            type: "POST",
            data: data,
            contentType: false,
            cache: false,
            processData: false
        }).then(function (data) {
            resolve(data.filename);
        }).fail(function (err) {
            reject(err);
        })
    })
}

function realTimeUpdate() {
    stringeeChat.on('onObjectChange', function (info) {

    });
}