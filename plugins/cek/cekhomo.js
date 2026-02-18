const pluginConfig = {
    name: 'cekhomo',
    alias: ['homo', 'ckhomo'],
    category: 'cek',
    description: 'Cek seberapa homo kamu',
    usage: '.cekhomo <nama>',
    example: '.cekhomo Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m) {
    const nama = m.text?.trim() || m.pushName || 'Kamu'
    
    // Special case untuk Jarjit
    if (nama.toLowerCase().includes('jarjit')) {
        let txt = `🏳️‍🌈 *ᴄᴇᴋ ʜᴏᴍᴏ*\n\n`
        txt += `> 👤 Nama: *${nama}*\n`
        txt += `> 📊 Tingkat: *100%* Homo\n\n`
        txt += `> fix homo pacarnya bagus eka 😂🔥`
        
        await m.reply(txt)
        return
    }
     if (nama.toLowerCase().includes('arpa')) {
        let txt = `🏳️‍🌈 *ᴄᴇᴋ ʜᴏᴍᴏ*\n\n`
        txt += `> 👤 Nama: *${nama}*\n`
        txt += `> 📊 Tingkat: *0%* Homo\n\n`
        txt += `> ini orang normal ygy 🔥`
        
        await m.reply(txt)
        return
    }
    
    const percent = Math.floor(Math.random() * 101)
    
    let desc = ''
    if (percent >= 90) {
        desc = 'FULL HOMO! 🏳️‍🌈✨'
    } else if (percent >= 70) {
        desc = 'Lumayan homo nih 👀'
    } else if (percent >= 50) {
        desc = 'Separuh homo mungkin 🤔'
    } else if (percent >= 30) {
        desc = 'Sedikit homo sih 😅'
    } else {
        desc = 'Nggak homo lah 😂'
    }
    
    let txt = `🏳️‍🌈 *ᴄᴇᴋ ʜᴏᴍᴏ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Homo\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
