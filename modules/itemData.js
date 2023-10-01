const weapons = [
    'https://forums.terraria.org/index.php?attachments/new-piskel-2-gif.289734/',
    'https://i.imgur.com/9cnwug2.png',
    'https://i.redd.it/l4t4wcisx1t51.png',
    'https://i.imgur.com/UgElRwO.png',
    'https://i.imgur.com/XTNo7Hh.png',
    'https://forums.terraria.org/index.php?attachments/227080/',
    'https://i.imgur.com/R9aXHLJ.png',
    'https://i.imgur.com/peS3Q7c.png',
    'https://i.imgur.com/kjcbhfn.png',
]
const armour = [
    'https://art.pixilart.com/0d5feab30daa34c.png',
    'https://art.pixilart.com/e296935582a0564.png',
    'https://art.pixilart.com/thumb/bb52acd58816e2e.png',
    'https://art.pixilart.com/thumb/409b90c4869f8c7.png',
    'https://art.pixilart.com/69c88403dc96f3b.png',
    'https://www.clipartmax.com/png/full/172-1721808_molten-armor-terraria-molten-armor-png.png',
    'https://art.pixilart.com/eadb598115da6ea.png'


]
const tiers = ['A', 'B', 'C']
const TYPES = {
    WEAPON: 'weapon',
    ARMOUR: 'armour',
    POTION: 'potion'
}
const random = (num, numToAdd) => {
    return Math.floor(Math.random() * num) + numToAdd
}

const generateId = () => {
    return Math.random()
}

const possibleEffects = [
    {name: 'Critical Chance', probability: 50},
    {name: 'Dodge Chance', probability: 40},
    {name: 'Life Steal Chance', probability: 50},
]

const BACKGROUNDS = {
    A: 'https://wallpapers.com/images/hd/pink-and-purple-galaxy-31xr9tu686biqmnl.jpg',
    B: 'https://cdn.pixabay.com/photo/2019/09/06/03/19/blue-4455324_960_720.jpg',
    C: 'https://www.onlygfx.com/wp-content/uploads/2018/07/4-light-green-watercolor-background-3.jpg',
    POTION: 'https://media.istockphoto.com/id/1329926309/vector/pastel-cyan-mint-liquid-marble-watercolor-background-with-gold-lines-and-brush-stains-teal.jpg?s=612x612&w=0&k=20&c=xovfdmRVX2fi5IGn_6aDsOXa3a7T335hcCmqVXAyvFA='
}
const generateEffects = (effectSlots, array, type) => {
    for (let i = 0; i < effectSlots ; i++) {
        const num = random(2,1)
        const randomEffect = possibleEffects[random(possibleEffects.length,0)]
        if (num === 1){
            const effect = {
                name: randomEffect.name,
                probability: random(randomEffect.probability, 1)
            }
            const hasSame = array.some(item => item.name === effect.name)
            if (!hasSame){
                if (type === TYPES.WEAPON && effect.name !== 'Dodge Chance'){{
                    array.push(effect)
                }}
                if (type === TYPES.ARMOUR && (effect.name !== 'Critical Chance' && effect.name !== 'Life Steal Chance')){
                    array.push(effect)
                }
            }
        }
    }
}

module.exports = {
    generateWeapon: () => {
        const tier = tiers[random(3,0)]
        const effects = []
        let damage = 0
        let effectSlots = 0
        let maxGold = 0
        let image = weapons[random(weapons.length, 0)]
        let background = ''
        if (tier === 'A'){
            background = BACKGROUNDS.A
            effectSlots = 3
            damage = {
                min: 6,
                max: random(25, 6)
            }
            maxGold = random(10,1)
        }
        if (tier === 'B'){
            background = BACKGROUNDS.B
            effectSlots = 1
            damage = {
                min: 3,
                max: random(18,3)
            }
            maxGold = random(6,1)
        }
        if (tier === 'C'){
            background = BACKGROUNDS.C
            effectSlots = 0
            damage = {
                min: 1,
                max: random(5, 1)
            }
            maxGold = random(3,1)
        }
        generateEffects(effectSlots, effects, TYPES.WEAPON)
        return {
            type: TYPES.WEAPON,
            image,
            background,
            tier,
            damage,
            effectSlots,
            effects,
            maxGold,
            id: generateId()
        }
    },
    generateArmour: () => {
        const tier = tiers[random(3,0)]
        const effects = []
        let effectsSlots = 0
        let armourPoints = 0
        let background = ''
        let image = armour[random(armour.length, 0)]
        if (tier === 'A'){
            armourPoints = random(81,10)
            effectsSlots = 3
            background = BACKGROUNDS.A
        }
        if (tier === 'B'){
            armourPoints = random(51,0)
            effectsSlots = 1
            background = BACKGROUNDS.B
        }
        if (tier === 'C'){
            armourPoints = random(21,0)
            effectsSlots = 0
            background = BACKGROUNDS.C
        }
        generateEffects(effectsSlots, effects, TYPES.ARMOUR)
        return {
            type: TYPES.ARMOUR,
            tier,
            image,
            background,
            armourPoints,
            effects,
            id: generateId()
        }
    },
    generatePotion: () => {
        const image = 'https://forums.terraria.org/index.php?attachments/greater_healing_potion-png.175739/'
        const hp = random(100, 1)
        const background = BACKGROUNDS.POTION
        return {
            type: TYPES.POTION,
            background,
            image,
            hp,
            id: generateId()
        }
    }
}