const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tomanga',
    alias: ['manga', 'mangafy', 'mangastyle'],
    category: 'ai',
    description: 'Ubah foto menjadi gaya manga Jepang',
    usage: '.tomanga (reply/kirim gambar)',
    example: '.tomanga',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    limit: 3,
    isEnabled: true
}

const PROMPT = `Convert this image into authentic Japanese manga style in pure black and white. 
Use high contrast ink lines, detailed halftone screentones for shading, bold outlines, 
and dramatic compositions typical of manga art. Apply crosshatching and dot patterns 
for depth. Maintain the original subject but render it with the distinctive Japanese 
manga aesthetic - clean line work, expressive features, and professional manga typography 
quality. Create a page-like composition with strong visual impact using only black ink 
and white space.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n` +
            `> Kirim/reply gambar untuk diubah ke gaya manga\n\n` +
            `\`${m.prefix}tomanga\``
        )
    }
    
    m.react('⏳')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        await m.reply(
            `⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n` +
            `> Mengubah gambar ke gaya manga\n` +
            `> Proses ini memakan waktu 1-3 menit\n\n` +
            `_Powered by NanoBanana AI_`
        )
        
        const result = await nanoBanana(buffer, PROMPT, {
            resolution: '4K',
            steps: 25,
            guidance_scale: 8
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n> Gaya: Japanese Manga\n> _Powered by NanoBanana AI_`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}\n\n_Coba lagi nanti_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
