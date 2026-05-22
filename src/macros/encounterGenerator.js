// Mythras Encounter Generator
// In order to use, create a new macro in Foundry, set it to "script" mode, and copy/paste this code into the text box. Then just hit "Execute Macro"

encounterGenerator()

function encounterGenerator() {
  let template = `
    <h2>Click <a href="https://gitlab.com/tpaoloni/mythras/-/tags/0.1.4">here</a> for instructions</h1>
    <h4><i/>Future releases of this macro will be located in the <a href="https://foundryvtt.com/packages/mythras-not-so-imperative">Mythras Not So Imperative</a> module</i></h4>
    <h3>Generate a single enemy</h2>
    <p>Mythras Encounter Generator Enemy ID: <input type="number" id="megid-enemy" /></p>
    <p>or<p>
    <p>Mythras Encounter Generator Enemy JSON: <input type="text" id="megJSON-enemy" /></p>
    <p><b>OR</b></p>
    <h3>Generate a party</h2>
    <p>Mythras Encounter Generator Party ID: <input type="number" id="megid-party" /></p>
    <p>or<p>
    <p>Mythras Encounter Generator Party JSON: <input type="text" id="megJSON-party" /></p>
  `
  new Dialog({
    title: 'Mythras Encounter Generator',
    content: template,
    buttons: {
      ok: {
        label: 'Create Actor',
        callback: async (html) => {
          generate(html)
        }
      },
      cancel: {
        label: 'Cancel'
      }
    }
  }).render(true)
}

async function generate(html) {
  let enemyId = html.find('#megid-enemy')[0].value
  let enemyJSON = html.find('#megJSON-enemy')[0].value
  let partyId = html.find('#megid-party')[0].value
  let partyJSON = html.find('#megJSON-party')[0].value
  if (
    (enemyId !== '' && partyId !== '') ||
    (enemyJSON !== '' && partyJSON !== '') ||
    (enemyId !== '' && partyJSON !== '') ||
    (enemyJSON !== '' && partyId !== '')
  ) {
    // Tried to make it pull up an error dialog here, but wasn't working
    // await new Dialog({
    //   title: "Error",
    //   content: "Please only enter one of ID",
    //   buttons: {
    //     ok: {
    //       label: "Okay",
    //       callback: async (html) => {
    //         encounterGenerator();
    //       },
    //     },
    //   },
    // });
  } else if (enemyJSON !== '') {
    generateEnemy(enemyJSON, 2)
  } else if (enemyId !== '') {
    generateEnemy(enemyId, 1)
  } else if (partyJSON !== '') {
    generateParty(partyJSON, 2)
  } else if (partyId !== '') {
    generateParty(partyId, 1)
  }
}

async function generateParty(partyData, type) {
  if (type == 1) {
    $.get(
      `https://thingproxy.freeboard.io/fetch/https://skoll.xyz/mythras_eg/generate_party_json/?id=${partyData}`,
      async (data) => {
        Folder.create({
          name: `${data['party_name']}`,
          type: 'Actor',
          parent: null
        }).then((folder) => {
          data.enemies.forEach((enemy) => {
            createActor(enemy, folder.id)
          })
        })
      }
    )
  } else if (type == 2) {
    let data = JSON.parse(partyData)
    Folder.create({
      name: `${data['party_name']}`,
      type: 'Actor',
      parent: null
    }).then((folder) => {
      data.enemies.forEach((enemy) => {
        createActor(enemy, folder.id)
      })
    })
  }
}

async function generateEnemy(enemyData, type) {
  if (type == 1) {
    $.get(
      `https://thingproxy.freeboard.io/fetch/https://skoll.xyz/mythras_eg/generate_enemies_json/?id=${enemyData}`,
      async (data) => {
        let skollEnemy = data[0]
        createActor(skollEnemy, null)
      }
    )
  } else if (type == 2) {
    createActor(JSON.parse(enemyData)[0], null)
  }
}

async function createActor(skollEnemy, folder) {
  /**************** Setup ******************/
  let actorData = {}
  actorData.characteristics = {}
  let actorItems = []

  let standardSkills = {}
  let professionalSkills = {}
  let magicSkills = [
    'Folk Magic',
    'Binding',
    'Trance',
    'Mysticism',
    'Meditation',
    'Devotion',
    'Exhort',
    'Invocation',
    'Shaping'
  ]
  let featuresList = []
  let abilities = ''
  let promiseChain = Promise.resolve()

  // Load standard skills from compendium
  promiseChain.then(
    await game.packs
      .get('mythras.standardSkill')
      .getDocuments()
      .then((result) => {
        result.forEach((skill, index) => {
          standardSkills[skill.name.toLocaleLowerCase()] = skill.system
        })
      })
  )

  // Load professional skills from compendium
  promiseChain.then(
    await game.packs
      .get('mythras.professionalSkill')
      .getDocuments()
      .then((result) => {
        result.forEach((skill, index) => {
          professionalSkills[skill.name.toLocaleLowerCase()] = skill.system
        })
      })
  )

  /******* Map Skoll Data to Actor Data *********/
  // Characteristics
  promiseChain.then(() => {
    skollEnemy.stats.forEach((stat) => {
      let statName = Object.keys(stat)[0]
      let statNameLower = statName.toLocaleLowerCase()
      actorData.characteristics[statNameLower] = {
        value: stat[statName],
        mod: 0
      }
    })

    // Profile and other attributes
    if (skollEnemy.profile) {
      actorData.career = skollEnemy.profile.career || ''
      actorData.homeland = skollEnemy.profile.homeland || ''
      actorData.socialClass = skollEnemy.profile.social_class || ''
      actorData.gender = skollEnemy.profile.gender || ''
      actorData.age = skollEnemy.profile.age || ''
      actorData.handedness = skollEnemy.profile.handedness || ''
      actorData.frame = skollEnemy.profile.frame || ''
      actorData.height = skollEnemy.profile.height || ''
      actorData.weight = skollEnemy.profile.weight || ''
      actorData.raceCulture = skollEnemy.profile.culture || ''
      actorData['cult information'] = skollEnemy.profile.cult_rank || ''
    }

    if (skollEnemy.notes_extra) {
      if (skollEnemy.notes_extra.cult) {
        if (actorData['cult information']) actorData['cult information'] += '\n'
        actorData['cult information'] += skollEnemy.notes_extra.cult
      }
      actorData.conditionsAndWounds = skollEnemy.notes_extra.wounds || ''
    }

    if (skollEnemy.movement) {
      actorData.attributes = actorData.attributes || {}
      actorData.attributes.movement = { walk: Number(skollEnemy.movement), mod: 0 }
    }

    if (skollEnemy.max_magic_points) {
      actorData.attributes = actorData.attributes || {}
      actorData.attributes.magicPoints = { value: Number(skollEnemy.max_magic_points), mod: 0 }
      actorData.currentMagicPoints = Number(skollEnemy.max_magic_points)
    }
  })
  // Combat Styles and Weapons
  promiseChain.then(() => {
    skollEnemy['combat_styles'].forEach((skill) => {
      let skillName = skill.name
      let skillType = 'combatStyle'
      let skillData = {}
      let baseScore =
        actorData.characteristics['str'].value + actorData.characteristics['dex'].value
      let trainingScore = Number(skill.value) - Number(baseScore)
      skillData.trainingVal = trainingScore
      let weaponNames = []
      skill.weapons.forEach((weapon) => {
        weaponNames.push(weapon.name)
        let weaponData = {}
        let name = ''
        let type = 'melee-weapon'

        name = weapon.name
        weaponData.ap = weapon.ap
        weaponData.hp = weapon.hp
        weaponData.damage = weapon.damage
        weaponData.damageModifier = weapon['add_damage_modifier']
        weaponData['combat-effects'] = weapon.effects
        if (weapon.type === 'ranged') {
          type = 'ranged-weapon'
          let rangeInc = weapon.range.split('/')
          if (rangeInc.length === 3) {
            weaponData.range = {
              close: rangeInc[0],
              effective: rangeInc[1],
              long: rangeInc[2]
            }
          }
          weaponData.force = weapon.size
        } else {
          type = 'melee-weapon'
          name += weapon.type.includes('2h') ? ' (Two-handed)' : ''
          weaponData.reach = weapon.reach
          weaponData.size = weapon.size
        }
        actorItems.push({
          name: name,
          type: type,
          system: weaponData
        })
      })
      skillData.weapons = weaponNames.join(', ')
      actorItems.push({
        name: skillName,
        type: skillType,
        system: skillData
      })
    })
  })
  // Skills
  promiseChain.then(() => {
    skollEnemy.skills.forEach((skill) => {
      let skillName = Object.keys(skill)[0]
      let skillNameLower = skillName.toLocaleLowerCase()
      let baseSkillName = skillName.split(/[(:]/)[0].trim()
      let baseSkillNameLower = baseSkillName.toLocaleLowerCase()
      let skillType = ''
      let skillData = {}

      if (standardSkills[skillNameLower]) {
        skillType = 'standardSkill'
        skillData = JSON.parse(JSON.stringify(standardSkills[skillNameLower]))
      } else if (standardSkills[baseSkillNameLower]) {
        skillType = 'standardSkill'
        skillData = JSON.parse(JSON.stringify(standardSkills[baseSkillNameLower]))
      } else if (magicSkills.includes(skillName)) {
        skillType = 'magicSkill'
        skillData = JSON.parse(JSON.stringify(professionalSkills[skillNameLower]))
      } else if (magicSkills.includes(baseSkillName)) {
        skillType = 'magicSkill'
        skillData = JSON.parse(JSON.stringify(professionalSkills[baseSkillNameLower]))
      } else if (professionalSkills[skillNameLower]) {
        skillType = 'professionalSkill'
        skillData = JSON.parse(JSON.stringify(professionalSkills[skillNameLower]))
      } else if (professionalSkills[baseSkillNameLower]) {
        skillType = 'professionalSkill'
        skillData = JSON.parse(JSON.stringify(professionalSkills[baseSkillNameLower]))
      }

      if (skillType !== '' && skillType !== 'passion') {
        let primaryChar = 11
        if (actorData.characteristics[skillData.primaryChar] !== undefined) {
          primaryChar = actorData.characteristics[skillData.primaryChar].value
        }
        let secondaryChar = 11
        if (actorData.characteristics[skillData.secondaryChar] !== undefined) {
          secondaryChar = actorData.characteristics[skillData.secondaryChar].value
        }
        let baseScore = primaryChar + secondaryChar
        let trainingScore = skill[skillName] - baseScore
        skillData.trainingVal = trainingScore
      } else if (skillName.split(':')[0].trim() === 'Passion') {
        let oldSkillName = skillName
        skillName = skillName.split(':')[1].trim()
        skillType = 'passion'
        let primaryChar = (actorData.characteristics['int'] && actorData.characteristics['int'].value) || 11
        let secondaryChar = (actorData.characteristics['int'] && actorData.characteristics['int'].value) || 11
        let baseScore = primaryChar + secondaryChar
        let trainingScore = skill[oldSkillName] - baseScore
        skillData = {
          description: '',
          primaryChar: 'int',
          secondaryChar: 'int',
          baseVal: { value: 0, init: 0 },
          trainingVal: trainingScore,
          miscBonus: 0,
          totalVal: 0
        }
      } else {
        skillType = 'professionalSkill'
        let baseScore =
          actorData.characteristics['str'].value + actorData.characteristics['str'].value
        let trainingScore = skill[skillName] - baseScore
        skillData = {
          description: '',
          primaryChar: 'str',
          secondaryChar: 'str',
          baseVal: { value: baseScore, init: baseScore },
          trainingVal: trainingScore,
          miscBonus: 0,
          totalVal: skill[skillName]
        }
      }

      actorItems.push({
        name: skillName,
        type: skillType,
        system: skillData
      })
    })
  })
  // Hit Locations
  promiseChain.then(() => {
    let armors = {}
    skollEnemy.hit_locations.forEach((hitLocation) => {
      let type = 'hitLocation'

      let name = hitLocation.name

      let rollRanges = hitLocation.range.split('-')
      let rollRangeStart = parseInt(rollRanges[0], 10)
      let rollRangeEnd = parseInt(rollRanges[1], 10)

      let con = 11
      if (actorData.characteristics['con'] !== undefined) {
        con = actorData.characteristics['con'].value
      }
      let siz = 11
      if (actorData.characteristics['siz'] !== undefined) {
        siz = actorData.characteristics['siz'].value
      }
      let hpBonus = Math.ceil((Number(con) + Number(siz)) / 5)
      let baseHp = hitLocation.hp - hpBonus
      let currentHp = hitLocation.hp

      let data = {
        rollRangeStart: rollRangeStart,
        rollRangeEnd: rollRangeEnd,
        baseHp: baseHp,
        naturalArmor: 0,
        maxHp: 0,
        currentHp: currentHp
      }

      if (hitLocation.armor && hitLocation.armor !== '') {
        if (!armors[hitLocation.armor]) {
          armors[hitLocation.armor] = { ap: hitLocation.ap, locations: [] }
        }
        armors[hitLocation.armor].locations.push(name)
      } else if (hitLocation.ap > 0) {
        data.naturalArmor = hitLocation.ap
      }

      actorItems.push({
        name: name,
        type: type,
        system: data
      })
    })

    // Create armor items
    Object.entries(armors).forEach(([armorName, armorData]) => {
      actorItems.push({
        name: armorName,
        type: 'armor',
        system: {
          ap: armorData.ap,
          locationName: armorData.locations,
          equipped: true
        }
      })
    })
  })
  // Abilities and Journal
  promiseChain.then(() => {
    if (skollEnemy.features.length > 0) {
      featuresList.push('<h2>Features</h2>')
      skollEnemy.features.forEach((feature) => {
        if (feature.includes('Ability')) {
          let featureSplit = feature.split('***')
          let featureJoin = '<strong>' + featureSplit[1] + ':</strong> ' + featureSplit[2]
          featuresList.push(featureJoin)
        } else {
          featuresList.push(feature)
        }
      })
    }
    if (skollEnemy['folk_spells'].length > 0) {
      featuresList.push('<br>')
      featuresList.push('<h2>Folk Magic</h2>')
      featuresList = featuresList.concat(skollEnemy['folk_spells'])
    }
    if (skollEnemy['theism_spells'].length > 0) {
      featuresList.push('<br>')
      featuresList.push('<h2>Theism</h2>')
      featuresList = featuresList.concat(skollEnemy['theism_spells'])
    }
    if (skollEnemy['sorcery_spells'].length > 0) {
      featuresList.push('<br>')
      featuresList.push('<h2>Sorcery</h2>')
      featuresList = featuresList.concat(skollEnemy['sorcery_spells'])
    }
      if (skollEnemy.magic && skollEnemy.magic.notes) {
        featuresList.push('<br>')
        featuresList.push('<h2>Magic Notes</h2>')
        featuresList.push(skollEnemy.magic.notes)
      }
      if (skollEnemy.notes_extra && skollEnemy.notes_extra.general) {
        featuresList.push('<br>')
        featuresList.push('<h2>General Notes</h2>')
        featuresList.push(skollEnemy.notes_extra.general)
      }
    if (skollEnemy['spirits'].length > 0) {
      featuresList.push('<br>')
      featuresList.push('<h2>Animism</h2>')
      let spiritList = ''
      skollEnemy.spirits.forEach((spirit) => {
        spiritList += '<h3>' + spirit.name + '</h3>'
        spiritList += '<ul>'
        if (spirit.features.length > 0) {
          spiritList += '<li><strong>Spirit Abilities</strong></li>'
          spiritList += '<ul><li>'
          spiritList += spirit.features.join('</li><li>')
          spiritList += '</li></ul>'
        }
        spiritList += `<li><strong>Characteristics:</strong> INT: ${spirit.stats[0].INT}, POW: ${spirit.stats[1].POW}, CHA: ${spirit.stats[2].CHA}`
        spiritList += `<li><strong>Attributes:</strong> 
          Intensity: ${spirit.attributes['spirit_intensity']}, 
          Magic Points: ${spirit.attributes['magic_points']}, 
          Spirit Damage: ${spirit.attributes['spirit_damage']}, 
          Initiative: ${spirit.attributes['strike_rank']}, 
          Action Points: ${spirit.attributes['action_points']}</li>`
        if (spirit.skills.length > 0) {
          spiritList += '<li><strong>Skills:</strong> '
          let tempSkillList = []
          spirit.skills.forEach((skill) => {
            let skillName = Object.keys(skill)[0]
            tempSkillList.push(skillName + ': ' + skill[skillName])
          })
          spiritList += tempSkillList.join(', ')
        }
        if (spirit['folk_spells'].length > 0) {
          spiritList +=
            '<li><strong>Folk Magic:</strong> ' + spirit['folk_spells'].join(', ') + '</li>'
        }
        if (spirit['theism_spells'].length > 0) {
          spiritList +=
            '<li><strong>Theism:</strong> ' + spirit['theism_spells'].join(', ') + '</li>'
        }
        if (spirit['sorcery_spells'].length > 0) {
          spiritList +=
            '<li><strong>Sorcery:</strong> ' + spirit['sorcery_spells'].join(', ') + '</li>'
        }
        if (spirit.notes.length > 0) {
          spiritList += '<li><strong>Notes:</strong> ' + spirit.notes
        }
        spiritList += '</ul>'
      })

      featuresList.push(spiritList)
    }
    abilities += featuresList.join('<br>')
    actorData.abilitiesDesc = abilities
    actorData.journal = skollEnemy.notes

    if (skollEnemy.equipment && skollEnemy.equipment.length > 0) {
      skollEnemy.equipment.forEach((item) => {
        actorItems.push({
          name: item.name,
          type: 'equipment',
          system: {
            description: item.notes || '',
            quantity: item.quantity || 1,
            encumbrance: item.enc || 0
          }
        })
      })
    }
  })
  // Add additional promises to the chain here for weapons and other stuff
  // (adding to the chain is not strictly necessary but helpful for organization. Also guarantees the order things will be run)

  /*********** Create the Actor *************/
  promiseChain.then(() => {
    Actor.create({
      name: skollEnemy.name,
      type: 'character',
      system: actorData,
      items: actorItems,
      folder: folder
    }).then((actor) => {
      // May need to add armor to the actor here since hitlocs exists here (or add another promise to the chain after the actor create one? i dunno)
      // Testing that hitlocs exist here
      let skollmod = skollEnemy.attributes.strike_rank
      let mod = 0
      if (skollmod.includes('-')) {
        let splitArray = skollmod.split('-')
        mod = '-' + splitArray[splitArray.length - 1].split(')')[0]
      } else if (skollmod.includes('+')) {
        let splitArray = skollmod.split('+')
        mod = splitArray[splitArray.length - 1].split(')')[0]
      }
      if (mod !== 0) {
        actor.update({
          ['system.attributes.initiativeBonus.mod']: Number(mod)
        })
      }
    })
  })
}
