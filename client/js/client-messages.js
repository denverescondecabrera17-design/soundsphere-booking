/**
 * SoundSphere - Real-Time SQL Server Client Messaging Controller
 * Handles direct user-to-provider & provider-to-client 1-to-1 messaging, real-time polling, and unread notifications
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. User Session Check
    const currentUser = SoundSphereAPI.getCurrentUser();
    if (!currentUser || (!currentUser.id && !currentUser.userId && !currentUser.UserID)) {
        window.location.href = 'login.html?redirect=client-messages.html';
        return;
    }

    const currentUserId = currentUser.id || currentUser.userId || currentUser.UserID;
    const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');

    // Headers Helper
    const getHeaders = () => {
        const h = { 'Content-Type': 'application/json' };
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    };

    // User Avatar Menu Header
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const directLogoutBtn = document.getElementById('direct-logout-btn');
    const userNameSpan = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-initials');

    const displayName = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserDisplayName) ? SoundSphereAPI.getUserDisplayName(currentUser) : (localStorage.getItem('soundsphere_user_name') || 'User Account');
    const initials = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserInitials) ? SoundSphereAPI.getUserInitials(currentUser) : 'UA';

    if (userNameSpan) userNameSpan.textContent = displayName;
    if (userAvatarImg) userAvatarImg.textContent = initials;

    if (avatarBtn && userDropdown) {
        const hideDropdown = () => {
            userDropdown.style.display = 'none';
            userDropdown.classList.remove('show');
            userDropdown.classList.add('hidden');
        };

        const showDropdown = () => {
            userDropdown.style.display = 'flex';
            userDropdown.classList.add('show');
            userDropdown.classList.remove('hidden');
        };

        avatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = userDropdown.style.display === 'none' || getComputedStyle(userDropdown).display === 'none' || !userDropdown.classList.contains('show');
            if (isHidden) {
                showDropdown();
            } else {
                hideDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    const handleLogout = (e) => {
        if (e) e.preventDefault();
        SoundSphereAPI.clearAuthSession();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html?logout=true';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (directLogoutBtn) directLogoutBtn.addEventListener('click', handleLogout);

    // DOM Elements
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    const notifBadge = document.getElementById('notif-badge-count');
    const btnMarkRead = document.getElementById('btn-mark-read');

    const threadsListContainer = document.getElementById('threads-list');
    const activeProviderName = document.getElementById('active-provider-name');
    const activeBookingTag = document.getElementById('active-booking-tag');
    const messagesStream = document.getElementById('messages-stream');
    const threadsSearchInput = document.getElementById('threads-search');

    const chatInput = document.getElementById('chat-text-input');
    const btnSendMessage = document.getElementById('btn-send-message');
    const btnAttachImg = document.getElementById('btn-attach-img');
    const imageFileInput = document.getElementById('image-file-input');

    // Messaging State
    let conversations = [];
    let activeConversationId = null;
    let isSending = false;
    let pollInterval = null;

    // Notification Dropdown Toggle
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notifDropdown) notifDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            if (notifDropdown) notifDropdown.classList.remove('show');
        });
    }

    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', () => {
            document.querySelectorAll('.notif-item').forEach(item => item.classList.remove('unread'));
            if (notifBadge) {
                notifBadge.textContent = '0';
                notifBadge.style.display = 'none';
            }
        });
    }

    // Helper: Format Date/Time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();

        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 2. Fetch Conversations List
    const fetchConversations = async () => {
        try {
            const res = await fetch(`/api/messages/conversations?userId=${currentUserId}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                conversations = data.conversations || [];
                renderConversationsList();
                updateUnreadBadge();
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const renderEmptyHeaderState = () => {
        const activeAvatarEl = document.getElementById('active-chat-avatar');
        const activeSubtitleEl = document.getElementById('active-status-subtitle');
        if (activeProviderName) activeProviderName.textContent = 'Direct Provider & Client Messaging';
        if (activeSubtitleEl) activeSubtitleEl.innerHTML = '<span class="green-dot-indicator"></span> Real-time Provider Inquiry';
        if (activeAvatarEl) activeAvatarEl.innerHTML = '<i class="fa-solid fa-comments" style="font-size:1.1rem; color:#ffffff;"></i>';
    };

    // 3. Update Unread Count Badge in Top Nav
    const updateUnreadBadge = () => {
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        if (notifBadge) {
            if (totalUnread > 0) {
                notifBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                notifBadge.style.display = 'inline-flex';
            } else {
                notifBadge.style.display = 'none';
            }
        }
    };

    // Helper: Unified Partner Avatar & Initials Generator
    const getPartnerAvatarUrl = (partner) => {
        const partnerName = partner?.name || (partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
        if (partner?.avatar && partner.avatar.trim() && !partner.avatar.includes('default_avatar')) {
            return partner.avatar;
        }
        // Extract Initials consistently (First & Last Word letters)
        const cleanName = partnerName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
        const words = cleanName.split(/\s+/).filter(w => w.length > 0);
        let initials = 'SP';
        if (words.length === 1) {
            initials = words[0].substring(0, 2).toUpperCase();
        } else if (words.length > 1) {
            initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0084ff&color=fff&font-size=0.45&bold=true`;
    };

    // 4. Render Conversations List on Left Panel
    const renderConversationsList = () => {
        if (!threadsListContainer) return;

        const searchTerm = (threadsSearchInput ? threadsSearchInput.value : '').toLowerCase().trim();

        const filtered = conversations.filter(c => {
            const nameMatch = (c.partner?.name || '').toLowerCase().includes(searchTerm);
            const msgMatch = (c.lastMessage?.text || '').toLowerCase().includes(searchTerm);
            const bookingMatch = (c.bookingId ? `#BK-${c.bookingId}` : '').toLowerCase().includes(searchTerm);
            return nameMatch || msgMatch || bookingMatch;
        });

        if (filtered.length === 0) {
            threadsListContainer.innerHTML = `
                <div style="padding: 30px 15px; text-align: center; color: #94a3b8;">
                    <i class="fa-solid fa-comments" style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"></i>
                    <p style="font-size: 0.9rem; font-weight: 600;">No conversations found.</p>
                    <span style="font-size: 0.78rem;">Start a chat with a service provider from the marketplace!</span>
                </div>
            `;
            return;
        }

        threadsListContainer.innerHTML = filtered.map(c => {
            const isActive = c.conversationId === activeConversationId;
            const partnerName = c.partner?.name || (c.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
            const partnerRole = c.partner?.role || 'Provider';
            const avatar = getPartnerAvatarUrl(c.partner);
            let lastText = 'No messages yet...';
            if (c.lastMessage) {
                const prefix = c.lastMessage.isMine ? 'You: ' : '';
                const txt = c.lastMessage.text || '';
                if (txt.startsWith('IMAGE_ATTACHMENT:') || txt.startsWith('data:image/')) {
                    lastText = `${prefix}📷 Sent a photo`;
                } else {
                    lastText = `${prefix}${txt}`;
                }
            }
            const lastTime = c.lastMessage ? formatTime(c.lastMessage.sentAt) : formatTime(c.updatedAt);
            const unread = c.unreadCount || 0;

            const partnerUserId = c.partner?.userId || c.partner?.id;
            const isProvider = c.partner?.role !== 'Client';

            return `
                <div class="thread-item ${isActive ? 'active' : ''} ${unread > 0 ? 'unread' : ''}" data-id="${c.conversationId}">
                    <div class="thread-avatar-wrap" ${isProvider && partnerUserId ? `onclick="event.stopPropagation(); window.location.href='/provider-detail.html?id=${partnerUserId}';" title="Click to view Storefront Profile of ${partnerName}" style="cursor:pointer;"` : ''}>
                        <img src="${avatar}" alt="${partnerName}" class="thread-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=0084ff&color=fff';">
                        <span class="online-status-badge"></span>
                        ${unread > 0 ? `<span class="badge-unread-dot" style="position:absolute; top:-2px; right:-2px; background:#0084ff; color:#fff; font-size:0.85rem; font-weight:800; border-radius:12px; padding:3px 8px; border:2px solid #fff; z-index:2;">${unread}</span>` : ''}
                    </div>
                    <div class="thread-info">
                        <div class="thread-top-row">
                            <span class="thread-name">${partnerName}</span>
                            <span class="thread-time">${lastTime}</span>
                        </div>
                        <div class="thread-booking-tag">
                            ${c.bookingId ? `Booking #BK-${c.bookingId}` : partnerRole}
                        </div>
                        <div class="thread-snippet">
                            ${lastText}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click listeners to threads
        document.querySelectorAll('.thread-item').forEach(item => {
            item.addEventListener('click', () => {
                const cid = parseInt(item.getAttribute('data-id'), 10);
                setActiveConversation(cid);
            });
        });
    };

    // 5. Set Active Conversation & Fetch Messages Thread
    const setActiveConversation = async (conversationId) => {
        activeConversationId = conversationId;
        renderConversationsList();
        await fetchMessagesThread(conversationId);
    };

    // 6. Fetch Single Conversation Messages Thread
    const fetchMessagesThread = async (conversationId) => {
        if (!conversationId) return;

        try {
            const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/messages/conversations/${conversationId}?userId=${currentUserId}`, { headers });
            const data = await res.json();

            if (data.success) {
                const conv = conversations.find(c => c.conversationId === conversationId);
                if (conv) {
                    conv.unreadCount = 0; // Marked read on server
                    updateUnreadBadge();

                    const partnerName = conv.partner?.name || (conv.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
                    const activeAvatarEl = document.getElementById('active-chat-avatar');
                    const activeSubtitleEl = document.getElementById('active-status-subtitle');
                    const activeHeaderUserInfo = document.getElementById('chat-header-user-info');
                    const avatarUrl = getPartnerAvatarUrl(conv.partner);
                    const partnerUserId = conv.partner?.userId || conv.partner?.id;
                    const isProvider = conv.partner?.role !== 'Client';

                    if (activeProviderName) {
                        if (isProvider && partnerUserId) {
                            activeProviderName.innerHTML = `${partnerName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; color:#2563eb; margin-left:6px;"></i>`;
                        } else {
                            activeProviderName.textContent = partnerName;
                        }
                    }
                    if (activeBookingTag) activeBookingTag.textContent = conv.bookingId ? `Associated Booking #BK-${conv.bookingId}` : `Role: ${conv.partner?.role || 'Provider'}`;

                    if (activeSubtitleEl) {
                        activeSubtitleEl.innerHTML = `<span class="green-dot-indicator"></span> ${conv.bookingId ? `Associated Booking #BK-${conv.bookingId}` : (conv.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider')}`;
                    }

                    if (activeAvatarEl) {
                        activeAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${partnerName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    }

                    if (activeHeaderUserInfo) {
                        if (isProvider && partnerUserId) {
                            activeHeaderUserInfo.style.cursor = 'pointer';
                            activeHeaderUserInfo.title = `Click to view Storefront Profile of ${partnerName}`;
                            activeHeaderUserInfo.onclick = () => {
                                window.location.href = `/provider-detail.html?id=${partnerUserId}`;
                            };
                        } else {
                            activeHeaderUserInfo.style.cursor = 'default';
                            activeHeaderUserInfo.title = '';
                            activeHeaderUserInfo.onclick = null;
                        }
                    }
                }

                renderMessagesStream(data.messages || []);
            }
        } catch (err) {
            console.error('Error fetching messages thread:', err);
        }
    };

    // 7. Render Messages Stream in Right Panel
    const renderMessagesStream = (messages) => {
        if (!messagesStream) return;

        if (messages.length === 0) {
            messagesStream.innerHTML = `
                <div class="messenger-empty-state">
                    <div class="messenger-empty-icon"><i class="fa-solid fa-paper-plane"></i></div>
                    <h3>Start the Conversation</h3>
                    <p>Send a message to discuss sound equipment, setup requirements, or booking details.</p>
                </div>
            `;
            return;
        }

        messagesStream.innerHTML = messages.map(msg => {
            const isMine = msg.isMine || msg.senderId === currentUserId;
            const timeStr = formatTime(msg.sentAt);
            const msgText = msg.text || '';

            let contentHtml = '';
            const isImgMsg = msgText.startsWith('IMAGE_ATTACHMENT:') || msgText.startsWith('data:image/') || (msgText.startsWith('http') && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(msgText));

            if (msgText.startsWith('IMAGE_ATTACHMENT:')) {
                const imgData = msgText.replace('IMAGE_ATTACHMENT:', '');
                contentHtml = `<img src="${imgData}" alt="Photo Attachment" class="chat-photo-attachment" style="max-width:340px; max-height:320px; border-radius:16px; object-fit:cover; display:block; box-shadow:0 4px 14px rgba(0,0,0,0.12); cursor:pointer;" onclick="window.openPhotoLightbox(this.src)">`;
            } else if (msgText.startsWith('data:image/') || (msgText.startsWith('http') && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(msgText))) {
                contentHtml = `<img src="${msgText}" alt="Photo Attachment" class="chat-photo-attachment" style="max-width:340px; max-height:320px; border-radius:16px; object-fit:cover; display:block; box-shadow:0 4px 14px rgba(0,0,0,0.12); cursor:pointer;" onclick="window.openPhotoLightbox(this.src)">`;
            } else {
                const safeText = msgText
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;")
                    .replace(/\n/g, "<br>");
                contentHtml = safeText;
            }

            return `
                <div class="message-bubble-row ${isMine ? 'client-side' : 'provider-side'}">
                    <div class="message-bubble ${isImgMsg ? 'image-bubble' : ''}" style="${isImgMsg ? 'padding:4px; background:none; box-shadow:none;' : ''}">
                        ${contentHtml}
                    </div>
                    <span class="message-time-stamp">${timeStr}</span>
                </div>
            `;
        }).join('');

        // Scroll to bottom of message thread
        messagesStream.scrollTop = messagesStream.scrollHeight;
    };

    // 8. Send New Message Handler
    const handleSendMessage = async () => {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text || !activeConversationId || isSending) return;

        isSending = true;
        chatInput.value = '';

        try {
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    conversationId: activeConversationId,
                    userId: currentUserId,
                    messageText: text
                })
            });

            const data = await res.json();
            if (data.success) {
                await fetchMessagesThread(activeConversationId);
                await fetchConversations();
            } else {
                alert(data.message || 'Failed to send message.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            isSending = false;
        }
    };

    // Bind Send Button & Enter Key
    if (btnSendMessage) {
        btnSendMessage.addEventListener('click', handleSendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Photo / Image Attachment Handler
    const sendImageMessage = async (imageDataUrl) => {
        if (!imageDataUrl || !activeConversationId || isSending) return;

        isSending = true;
        try {
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    conversationId: activeConversationId,
                    userId: currentUserId,
                    messageText: `IMAGE_ATTACHMENT:${imageDataUrl}`
                })
            });

            const data = await res.json();
            if (data.success) {
                if (typeof showToast === 'function') {
                    showToast('✓ Photo attachment sent!', 'success', 2500);
                }
                await fetchMessagesThread(activeConversationId);
                await fetchConversations();
            } else {
                alert(data.message || 'Failed to send image.');
            }
        } catch (err) {
            console.error('Error sending image message:', err);
            alert('Failed to send photo attachment. Please try again.');
        } finally {
            isSending = false;
            if (imageFileInput) imageFileInput.value = '';
        }
    };

    if (btnAttachImg && imageFileInput) {
        btnAttachImg.addEventListener('click', () => {
            if (!activeConversationId) {
                if (typeof showToast === 'function') {
                    showToast('Please select a conversation first to attach photos.', 'warning');
                } else {
                    alert('Please select a conversation first to attach photos.');
                }
                return;
            }
            imageFileInput.click();
        });

        imageFileInput.addEventListener('change', () => {
            if (imageFileInput.files && imageFileInput.files[0]) {
                const file = imageFileInput.files[0];
                if (!file.type.startsWith('image/')) {
                    if (typeof showToast === 'function') {
                        showToast('Please select a valid image file.', 'warning');
                    } else {
                        alert('Please select a valid image file.');
                    }
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 800;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        sendImageMessage(resizedDataUrl);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Search Filter Input Listener
    if (threadsSearchInput) {
        threadsSearchInput.addEventListener('input', renderConversationsList);
    }

    // 9. Handle URL Query Parameters (e.g., ?providerId=101&providerName=...)
    const urlParams = new URLSearchParams(window.location.search);
    const targetProviderId = urlParams.get('providerId') || urlParams.get('recipientUserId');
    const targetBookingId = urlParams.get('bookingId');
    const targetConvId = parseInt(urlParams.get('convId') || urlParams.get('conversationId') || urlParams.get('conv'), 10);

    await fetchConversations();

    if (targetProviderId) {
        const pIdNum = parseInt(targetProviderId, 10);
        let existingConv = conversations.find(c => c.partner?.userId === pIdNum || c.partner?.id === pIdNum);

        if (existingConv) {
            setActiveConversation(existingConv.conversationId);
        } else {
            try {
                const startRes = await fetch('/api/messages/conversations', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        userId: currentUserId,
                        providerId: pIdNum,
                        bookingId: targetBookingId || null
                    })
                });
                const startData = await startRes.json();
                if (startData.success && startData.conversation) {
                    await fetchConversations();
                    const newConvId = startData.conversation.ConversationID || startData.conversation.conversationId;
                    setActiveConversation(newConvId);
                } else if (conversations.length > 0) {
                    setActiveConversation(conversations[0].conversationId);
                } else {
                    renderEmptyHeaderState();
                }
            } catch (err) {
                console.error('Error starting conversation from URL:', err);
                if (conversations.length > 0) setActiveConversation(conversations[0].conversationId);
            }
        }
    } else if (!isNaN(targetConvId)) {
        const existingConv = conversations.find(c => c.conversationId === targetConvId);
        if (existingConv) {
            setActiveConversation(existingConv.conversationId);
        } else if (conversations.length > 0) {
            setActiveConversation(conversations[0].conversationId);
        }
    } else if (conversations.length > 0) {
        // Default to first active conversation
        setActiveConversation(conversations[0].conversationId);
    } else {
        renderEmptyHeaderState();
    }

    // 10. Background Real-Time Polling (every 3 seconds)
    pollInterval = setInterval(async () => {
        await fetchConversations();
        if (activeConversationId) {
            await fetchMessagesThread(activeConversationId);
        }
    }, 3000);
});

// Photo Lightbox Viewer Controller
window.openPhotoLightbox = (imageSrc) => {
    if (!imageSrc) return;

    let modal = document.getElementById('photo-lightbox-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-lightbox-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(10, 20, 35, 0.95); backdrop-filter:blur(10px); display:none; flex-direction:column; align-items:center; justify-content:center; z-index:9999999; opacity:0; transition:opacity 0.25s ease; box-sizing:border-box; padding:20px;';
        modal.innerHTML = `
            <div style="position:absolute; top:20px; right:28px; display:flex; align-items:center; gap:12px; z-index:10000000;">
                <a id="lightbox-download-btn" href="" download="photo-attachment.jpg" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:48px; height:48px; border-radius:50%; text-decoration:none; display:flex; align-items:center; justify-content:center; font-size:1.3rem; transition:background 0.2s ease;" title="Download Photo">
                    <i class="fa-solid fa-download"></i>
                </a>
                <button type="button" id="lightbox-close-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:48px; height:48px; border-radius:50%; font-size:1.6rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Close Viewer">&times;</button>
            </div>
            <div style="max-width:94vw; max-height:88vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                <img id="lightbox-full-img" src="" alt="Enlarged Photo Attachment" style="max-width:92vw; max-height:86vh; border-radius:14px; object-fit:contain; box-shadow:0 25px 60px rgba(0,0,0,0.6); transform:scale(0.92); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'lightbox-close-btn' || e.target.closest('#lightbox-close-btn')) {
                window.closePhotoLightbox();
            }
        });
    }

    const img = modal.querySelector('#lightbox-full-img');
    const dlBtn = modal.querySelector('#lightbox-download-btn');
    if (!img) return;

    img.src = imageSrc;
    if (dlBtn) dlBtn.href = imageSrc;

    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '0', 'important');

    requestAnimationFrame(() => {
        modal.style.setProperty('opacity', '1', 'important');
        img.style.transform = 'scale(1)';
    });
};

window.closePhotoLightbox = () => {
    const modal = document.getElementById('photo-lightbox-modal');
    const img = modal ? modal.querySelector('#lightbox-full-img') : null;
    if (!modal) return;

    modal.style.setProperty('opacity', '0', 'important');
    if (img) img.style.transform = 'scale(0.92)';
    setTimeout(() => {
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        if (img) img.src = '';
    }, 250);
};

// Global Event Delegation for all chat photo attachments
document.addEventListener('click', (e) => {
    const imgEl = e.target.closest('.message-bubble img, .chat-photo-attachment');
    if (imgEl && imgEl.src && !e.target.closest('#photo-lightbox-modal')) {
        e.preventDefault();
        e.stopPropagation();
        window.openPhotoLightbox(imgEl.src);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closePhotoLightbox();
});

