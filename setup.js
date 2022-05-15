const inquirer = require('inquirer')
const fs = require('fs')
const { spawn } = require('child_process')

const defaultDB = 'mongodb://localhost:27017/mainesia-automod'

const walkForFiles = (dir, target) => {
    let results = []
    const list = fs.readdirSync(dir)
    list.forEach((file) => {
        file = dir + '/' + file
        const stat = fs.statSync(file)
        if (target && !file.includes(target)) return
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walkForFiles(file, target))
        } else {
            /* Is a file */
            results.push(file)
        }
    })
    return results
}

const importPreviousConfigs = async () => {
    const envFound = walkForFiles('./', '.env')
    const res = await inquirer.prompt({
        type: 'confirm',
        name: 'usePreviousConfig',
        message: 'A .env file already exists. Do you want to use it?',
    })

    if (res.usePreviousConfig) {
        fs.copyFile(envFound[0], './.env', (err) => {
            if (err) {
                console.log(err)
                return
            }
        })
    }
}

const setupConfig = async () => {
    console.log('Initializing bot config...')
    const answers = await inquirer.prompt(prompts)
    if (answers.mongoDefault != 1) {
        const mongoPath = await inquirer.prompt({
            type: 'input',
            name: 'mongoAddress',
            message: 'Please enter the address of your MongoDB database.',
        })
        return {
            ...mongoPath,
            mongoDefault: false,
        }
    }

    const { token, prefix, mongoDefault, mongoAddress } = answers

    fs.writeFileSync('./.env', `TOKEN=${token}\nPREFIX=${prefix}\nMONGODB=${mongoDefault ? defaultDB : mongoAddress}`)
    console.log('REMEMBER TO NEVER SHARE YOUR TOKEN WITH ANYONE!')
}

const initiateBot = async () => {
    const runningTheBot = spawn('node', ['index.js'], { shell: true })
    runningTheBot.stdout.on('data', (data) => {
        console.log(data.toString())
    })

    runningTheBot.stderr.on('data', (data) => {
        console.error(data.toString())
    })

    runningTheBot.on('close', (code) => {
        console.log(`child_process.spawn: exited with code ${code}`)
    })
}

const runBot = async () => {
    const response = await inquirer.prompt({
        type: 'list',
        name: 'runBot',
        message: 'Configuration has been written. Do you want to start the bot?',
        choices: ['Yes', 'No'],
    })
    if (response.runBot && response.runBot === 'Yes') {
        console.log('Starting bot. Have fun!')
        initiateBot()
    } else {
        console.log('Bot is ready to go. Simply run node index.js to start it.')
    }
}

let prompts = [
    {
        type: 'password',
        name: 'token',
        mask: '*',
        message: 'Please enter your bot token from its application page.',
    },
    {
        type: 'input',
        name: 'prefix',
        message: 'Please enter the prefix for the bot.',
    },
    {
        type: 'confirm',
        name: 'mongoDefault',
        message: `Are you hosting your Mongo database locally? (default: ${defaultDB})`,
        default: 1,
    },
]

;(async () => {
    const envFound = walkForFiles('./', '.env')
    if (envFound.length > 0) {
        await importPreviousConfigs()
    } else {
        await setupConfig()
    }
    await runBot()
})()
