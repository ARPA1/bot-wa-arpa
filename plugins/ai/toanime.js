const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toanime',
    alias: ['anime', 'animefy', 'ghibli'],
    category: 'ai',
    description: 'Ubah foto menjadi gaya anime/Ghibli Studio',
    usage: '.toanime (reply/kirim gambar)',
    example: '.toanime',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    limit: -1,
    isEnabled: true
}

const PROMPT = `Transform this image into anime style. 
Convert this to a high-quality anime art style with vibrant colors, 
detailed linework, expressive eyes, and beautiful manga-like aesthetics. 
Keep the original composition but apply a clean anime artistic style with 
smooth gradients, dynamic shading, and striking visual appeal.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🎨 *ᴛᴏ ᴀɴɪᴍᴇ*\n\n` +
            `> Kirim/reply gambar untuk diubah ke gaya anime\n\n` +
            `\`${m.prefix}toanime\``
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
            `> Mengubah gambar ke gaya anime\n` +
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
            caption: `🎨 *ᴛᴏ ᴀɴɪᴍᴇ*\n\n> Gaya: sss (suka suka gw)\n> _Powered by NanoBanana AI_`
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
