const pluginConfig = {
    name: 'add',
    alias: ['addmember', 'invite'],
    category: 'group',
    description: 'Menambahkan member (Versi Final Admin Check)',
    usage: '.add <nomor>',
    example: '.add +62 813-5300-1338',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    // 1. Ambil input
    const fullInput = (m.args || []).join(' ')
    if (!fullInput) return m.reply(`Mana nomornya?`)

    let targetGroup = m.isGroup ? m.chat : null
    let targetNumbers = []

    // 2. Parsing Nomor
    const segments = fullInput.split(',')
    for (let segment of segments) {
        let text = segment.trim()
        const linkMatch = text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)
        if (linkMatch) {
            try {
                const groupInfo = await sock.groupGetInviteInfo(linkMatch[1])
                targetGroup = groupInfo.id
                continue 
            } catch (e) { return m.reply(`❌ Link grup busuk!`) }
        }
        let cleaned = text.replace(/[^0-9]/g, '')
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)
        else if (cleaned.startsWith('8')) cleaned = '62' + cleaned
        if (cleaned.length >= 10) targetNumbers.push(cleaned + '@s.whatsapp.net')
    }

    if (targetNumbers.length === 0 || !targetGroup) return m.reply(`❌ Input nggak valid!`)

    try {
        // 3. CARA CEK ADMIN TOTAL (REBASED)
        const groupMeta = await sock.groupMetadata(targetGroup, true)

        // 4. Eksekusi Add
        m.react('⏳')
        const results = await sock.groupParticipantsUpdate(targetGroup, targetNumbers, 'add')
        
        let success = [], invited = [], failed = []
        for (const res of results) {
            const n = res.jid.split('@')[0]
            if (res.status === '200') success.push(n)
            else if (res.status === '408') invited.push(n)
            else failed.push(n)
        }

        let msg = `👥 *RESULT:*\n`
        if (success.length) msg += `✅ Berhasil: ${success.join(', ')}\n`
        if (invited.length) msg += `📩 Undangan: ${invited.join(', ')}\n`
        if (failed.length) msg += `❌ Gagal: ${failed.join(', ')}`
        
        m.react('✅')
        await m.reply(msg)

    } catch (error) {
        console.error(error)
        m.reply(`❌ *FATAL ERROR:* ${error.message}`)
    }
}

module.exports = { config: pluginConfig, handler }