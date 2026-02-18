const { downloadContentFromMessage } = require('ourin')

const pluginConfig = {
    name: 'rvo',
    alias: ['openvo'],
    category: 'group',
    description: 'Membuka pesan 1x lihat',
    usage: '.rvo (reply pesan 1x lihat) | .rvo last (buka 1x lihat terbaru)',
    example: '.rvo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let quoted = m.quoted
    const text = m.text.toLowerCase().trim()
    const isLastCommand = text === 'last' || text.endsWith(' last') || text === '.rvo last'
    
    // Jika tidak ada reply, cek apakah user mengirim forwarded message atau minta scan terbaru
    if (!quoted) {
        // Opsi 1: Jika command `.rvo last`, cari pesan 1x lihat terbaru
        if (isLastCommand) {
            return await searchLastViewOnce(m, sock)
        }
        
        // Opsi 2: Jika current message adalah result of forward, ekstrak viewOnce dari sana
        const msg = m.message
        if (msg?.extendedTextMessage?.contextInfo?.forwardingScore > 0 
            || msg?.imageMessage?.contextInfo?.forwardingScore > 0 
            || msg?.videoMessage?.contextInfo?.forwardingScore > 0
            || msg?.audioMessage?.contextInfo?.forwardingScore > 0) {
            // Coba gunakan contextInfo dari forwarded message
            const ctx = msg?.extendedTextMessage?.contextInfo 
                     || msg?.imageMessage?.contextInfo 
                     || msg?.videoMessage?.contextInfo
                     || msg?.audioMessage?.contextInfo
            if (ctx?.quotedMessage) {
                quoted = {
                    message: ctx.quotedMessage,
                    key: {
                        remoteJid: m.chat,
                        participant: ctx.participant || ''
                    }
                }
            }
        }
        
        if (!quoted) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Balas pesan 1x lihat dengan perintah ini!\n\n` +
                `📌 *Opsi Alternatif:*\n` +
                `1. Forward pesan 1x lihat, lalu gunakan: \`${m.prefix}rvo\`\n` +
                `2. Cari 1x lihat terbaru: \`${m.prefix}rvo last\``
            )
            return
        }
    }

    const quotedMsg = quoted.message
    if (!quotedMsg) {
        await m.reply(
            `❌ *ᴘᴇsᴀɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Tidak dapat membaca pesan yang di-reply.`
        )
        return
    }

    const type = Object.keys(quotedMsg)[0]
    const content = quotedMsg[type]

    if (!content) {
        await m.reply(
            `❌ *ᴋᴏɴᴛᴇɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Konten pesan tidak dapat dibaca.`
        )
        return
    }

    if (!content.viewOnce) {
        await m.reply(
            `❌ *ʙᴜᴋᴀɴ ᴠɪᴇᴡᴏɴᴄᴇ*\n\n` +
            `> Pesan yang di-reply bukan pesan 1x lihat!\n` +
            `> Balas pesan dengan ikon 1x lihat (👁️).`
        )
        return
    }

    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Membuka pesan 1x lihat...`)

    try {
        let mediaType = null
        if (type.includes('image')) {
            mediaType = 'image'
        } else if (type.includes('video')) {
            mediaType = 'video'
        } else if (type.includes('audio')) {
            mediaType = 'audio'
        }

        if (!mediaType) {
            await m.reply(
                `❌ *ᴛɪᴘᴇ ᴛɪᴅᴀᴋ ᴅɪᴅᴜᴋᴜɴɢ*\n\n` +
                `> Tipe media: ${type}\n` +
                `> Hanya mendukung: image, video, audio`
            )
            return
        }

        const stream = await downloadContentFromMessage(content, mediaType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n` +
                `> Tidak dapat mengunduh media.\n` +
                `> Media mungkin sudah kadaluarsa.`
            )
            return
        }

        const caption = content.caption || ''
        const senderNumber = quoted.key?.participant?.split('@')[0] || 'Unknown'

        const msgContent = {
            caption: `👁️ *ᴠɪᴇᴡᴏɴᴄᴇ ᴏᴘᴇɴᴇᴅ*\n\n` +
                `> Dari: @${senderNumber}\n` +
                (caption ? `> Caption: ${caption}` : ''),
            mentions: quoted.key?.participant ? [quoted.key.participant] : []
        }

        if (mediaType === 'image') {
            msgContent.image = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'video') {
            msgContent.video = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'audio') {
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m })
        }

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal membuka pesan 1x lihat.\n` +
            `> _${error.message}_`
        )
    }
}

// Fungsi helper: scan pesan terbaru untuk mencari viewOnce
async function searchLastViewOnce(m, sock) {
    try {
        const store = sock.store
        if (!store) {
            await m.reply(`❌ Store tidak tersedia`)
            return
        }

        // Debug: cek struktur store
        console.log('DEBUG: store keys:', Object.keys(store))
        console.log('DEBUG: store.messages type:', typeof store.messages)
        console.log('DEBUG: m.chat:', m.chat)
        
        let messagesInChat = null
        
        // Coba berbagai cara mengakses store messages
        if (store.messages && store.messages[m.chat]) {
            messagesInChat = store.messages[m.chat]
            console.log('DEBUG: Found messages via direct access, count:', messagesInChat?.length)
        }
        
        // Jika tidak ada, coba loadMessage
        if (!messagesInChat && typeof store.loadMessage === 'function') {
            try {
                messagesInChat = await store.loadMessage(m.chat)
                console.log('DEBUG: Found messages via loadMessage, count:', messagesInChat?.length)
            } catch (e) {
                console.log('DEBUG: loadMessage error:', e.message)
            }
        }

        // Jika masih tidak ada, scan semua message
        if (!messagesInChat && store.messages) {
            console.log('DEBUG: Trying to find in store.messages')
            const allMsgKeys = Object.keys(store.messages)
            console.log('DEBUG: Available message keys:', allMsgKeys.slice(0, 5))
            
            for (const key of allMsgKeys) {
                const msgs = store.messages[key]
                if (Array.isArray(msgs) && msgs.length > 0) {
                    const filtered = msgs.filter(msg => {
                        const remoteJid = msg.key?.remoteJid
                        return remoteJid === m.chat
                    })
                    if (filtered.length > 0) {
                        messagesInChat = filtered
                        console.log('DEBUG: Found messages in key:', key, 'count:', filtered.length)
                        break
                    }
                }
            }
        }
        
        if (!messagesInChat || messagesInChat.length === 0) {
            // Debug: cek struktur messagesInChat
            console.log('DEBUG: messagesInChat type:', typeof messagesInChat, 'is array:', Array.isArray(messagesInChat))
            console.log('DEBUG: messagesInChat keys:', messagesInChat ? Object.keys(messagesInChat).slice(0, 10) : 'null')
            
            if (messagesInChat && !Array.isArray(messagesInChat)) {
                console.log('DEBUG: messagesInChat is object, converting to array from values')
                messagesInChat = Object.values(messagesInChat).flat()
            }
            
            if (!messagesInChat || messagesInChat.length === 0) {
                console.log('DEBUG: After conversion still empty')
                await m.reply(`❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n> Tidak ada pesan 1x lihat ditemukan.\n> Coba balas pesan 1x lihat dengan: \`.rvo\``)
                return
            }
        }

        // Convert ke array jika object
        if (!Array.isArray(messagesInChat)) {
            console.log('DEBUG: Converting object to array, keys count:', Object.keys(messagesInChat).length)
            const msgArray = []
            for (const key in messagesInChat) {
                const val = messagesInChat[key]
                // Jika value adalah function, coba panggil
                if (typeof val === 'function') {
                    try {
                        msgArray.push(val())
                    } catch (e) {
                        // Skip
                    }
                } else {
                    msgArray.push(val)
                }
            }
            messagesInChat = msgArray.filter(m => m !== null && m !== undefined)
            console.log('DEBUG: Converted to array, length:', messagesInChat.length)
        }

        console.log('DEBUG: Total messages to scan:', messagesInChat.length)
        
        // DEBUG: Log actual message types
        for (let i = 0; i < Math.min(3, messagesInChat.length); i++) {
            const msg = messagesInChat[i]
            console.log(`DEBUG: msg[${i}] type:`, typeof msg, 'keys:', Object.keys(msg).slice(0, 5), 'toString:', Object.prototype.toString.call(msg))
            if (typeof msg === 'function') {
                console.log(`DEBUG: msg[${i}] function name:`, msg.name, 'toString:', msg.toString().substring(0, 100))
            }
            if (typeof msg === 'object' && msg !== null) {
                console.log(`DEBUG: msg[${i}] object keys:`, Object.keys(msg))
                console.log(`DEBUG: msg[${i}] has message?:`, msg.message)
                console.log(`DEBUG: msg[${i}] direct content:`, JSON.stringify(msg).substring(0, 200))
            }
        }

        // Scan dari belakang (pesan terbaru) untuk mencari viewOnce
        let foundViewOnce = null
        let scannedCount = 0
        for (let i = messagesInChat.length - 1; i >= 0; i--) {
            let msg = messagesInChat[i]
            scannedCount++
            
            // Jika function, coba panggil
            if (typeof msg === 'function') {
                console.log(`DEBUG: msg[${i}] is function, trying to call it...`)
                try {
                    msg = msg()
                } catch (e) {
                    console.log(`DEBUG: Failed to call msg[${i}]:`, e.message)
                    continue
                }
            }
            
            if (!msg) continue

            // Coba 2 format: msg.message atau msg langsung
            const msgObj = msg.message || msg
            if (!msgObj) continue
            
            // Cara 1: Cek langsung di message object (viewOnceMessage, viewOnceMessageV2)
            if (msgObj.viewOnceMessage) {
                console.log('DEBUG: Found via viewOnceMessage at index', i)
                foundViewOnce = {
                    message: msgObj,
                    key: msg.key
                }
                break
            }
            if (msgObj.viewOnceMessageV2) {
                console.log('DEBUG: Found via viewOnceMessageV2 at index', i)
                foundViewOnce = {
                    message: msgObj,
                    key: msg.key
                }
                break
            }

            // Cara 2: Cek di setiap type message
            const msgType = Object.keys(msgObj)[0]
            if (!msgType) continue
            
            const msgContent = msgObj[msgType]
            if (!msgContent) continue

            // Cek viewOnce flag langsung
            if (msgContent.viewOnce === true) {
                console.log('DEBUG: Found via viewOnce flag on', msgType, 'at index', i)
                foundViewOnce = {
                    message: msgObj,
                    key: msg.key || msg.key
                }
                break
            }

            // Cara 3: Cek di nested message field
            if (msgContent.message && msgContent.message.viewOnceMessage) {
                console.log('DEBUG: Found via nested viewOnceMessage at index', i)
                foundViewOnce = {
                    message: msgObj,
                    key: msg.key || msg.key
                }
                break
            }

            // Cara 4: Cek di contextInfo untuk forwarded viewOnce
            const contextInfo = msgContent.contextInfo
            if (contextInfo && contextInfo.quotedMessage) {
                const quoted = contextInfo.quotedMessage
                const quotedType = Object.keys(quoted)[0]
                if (quotedType && (quoted[quotedType].viewOnce === true || quoted.viewOnceMessage || quoted.viewOnceMessageV2)) {
                    console.log('DEBUG: Found via contextInfo quoted at index', i)
                    foundViewOnce = {
                        message: msgObj,
                        key: msg.key || msg.key
                    }
                    break
                }
            }

            // Cara 5: Cek image/video/audio yang punya viewOnce flag
            if ((msgType === 'imageMessage' || msgType === 'videoMessage' || msgType === 'audioMessage') 
                && msgContent.viewOnce === true) {
                console.log('DEBUG: Found via', msgType, 'with viewOnce at index', i)
                foundViewOnce = {
                    message: msgObj,
                    key: msg.key || msg.key
                }
                break
            }
        }
        
        console.log('DEBUG: Scanned', scannedCount, 'messages, found:', foundViewOnce ? 'yes' : 'no')

        if (!foundViewOnce) {
            await m.reply(
                `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n` +
                `> Tidak ditemukan pesan 1x lihat di chat ini.\n` +
                `> Coba balas pesan 1x lihat dengan: \`${m.prefix}rvo\``
            )
            return
        }

        // Proses pesan yang ditemukan (reuse logic dari handler)
        const type = Object.keys(foundViewOnce.message)[0]
        const content = foundViewOnce.message[type]

        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Membuka pesan 1x lihat terbaru...`)

        let mediaType = null
        if (type.includes('image')) {
            mediaType = 'image'
        } else if (type.includes('video')) {
            mediaType = 'video'
        } else if (type.includes('audio')) {
            mediaType = 'audio'
        }

        if (!mediaType) {
            await m.reply(
                `❌ *ᴛɪᴘᴇ ᴛɪᴅᴀᴋ ᴅɪᴅᴜᴋᴜɴɢ*\n\n` +
                `> Tipe media: ${type}\n` +
                `> Hanya mendukung: image, video, audio`
            )
            return
        }

        const stream = await downloadContentFromMessage(content, mediaType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n` +
                `> Tidak dapat mengunduh media.\n` +
                `> Media mungkin sudah kadaluarsa.`
            )
            return
        }

        const caption = content.caption || ''
        const senderNumber = foundViewOnce.key?.participant?.split('@')[0] || 'Unknown'

        const msgContent = {
            caption: `👁️ *ᴠɪᴇᴡᴏɴᴄᴇ ᴏᴘᴇɴᴇᴅ* (ᴛᴇʀʙᴀʀᴜ)\n\n` +
                `> Dari: @${senderNumber}\n` +
                (caption ? `> Caption: ${caption}` : ''),
            mentions: foundViewOnce.key?.participant ? [foundViewOnce.key.participant] : []
        }

        if (mediaType === 'image') {
            msgContent.image = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'video') {
            msgContent.video = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'audio') {
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m })
        }

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal mencari pesan 1x lihat.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    searchLastViewOnce
}
