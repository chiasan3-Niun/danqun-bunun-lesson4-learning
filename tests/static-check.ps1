$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Assert-Check($condition, $message) {
    if (-not $condition) {
        Write-Output "FAIL: $message"
        exit 1
    }
}

foreach ($file in 'index.html', 'data/lesson4.js', 'README.md') {
    Assert-Check (Test-Path -LiteralPath (Join-Path $root $file) -PathType Leaf) "Missing $file"
}

$html = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw -Encoding UTF8
$js = Get-Content -LiteralPath (Join-Path $root 'data/lesson4.js') -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath (Join-Path $root 'README.md') -Raw -Encoding UTF8
foreach ($container in 'header:course-header', 'section:study-area', 'nav:level-map', 'section:feedback-area', 'section:progress-area', 'p:status-message') {
    $tag, $id = $container.Split(':')
    Assert-Check ($html -match "<$tag\b[^>]*\bid=""$id""") "Missing $tag#$id"
}
Assert-Check ($html -match '<main\b' -and $html -match 'id="status-message"[^>]*role="status"') 'Missing main landmark or live status role'
Assert-Check ($html -match '<script\b[^>]*\bsrc="(?:\./)?data/lesson4\.js"') 'Lesson data is not loaded locally'
Assert-Check ("$html $js $readme" -notmatch 'unit-school-supplies|school[-_]supplies') 'References the unrelated root lesson'
Assert-Check ($html -notmatch '(?:src|href)\s*=\s*[''"](?:\.\./|/)') 'References files outside the site'

Assert-Check ($js -match '(?s)^\s*globalThis\.lesson4Data\s*=\s*(\{.*\});\s*$') 'Missing JSON data assigned to globalThis.lesson4Data'
$data = $Matches[1] | ConvertFrom-Json
Assert-Check ($data.dialectStatus -ceq 'confirmed') 'Missing confirmed dialect status'
Assert-Check ($data.audioStatus -ceq 'available') 'Missing available-audio status'
Assert-Check ($data.audioSourceUrl -match '^https://ai-labs\.ilrdf\.org\.tw/') 'Missing official audio source URL'

Assert-Check ($data.audioAssets.Count -eq 17) 'Expected seven vocabulary and ten sentence audio records'
$danqun = [string]([char]0x4e39) + [char]0x7fa4
$shanqun = [string]([char]0x55ae) + [char]0x7fa4
foreach ($audio in $data.audioAssets) {
    foreach ($field in 'id', 'targetId', 'assetPath', 'sourceUrl', 'dialect', 'status', 'verifiedBy', 'createdAt') {
        Assert-Check ($audio.$field -ne $null -and "$($audio.$field)".Length -gt 0) "Audio metadata missing $field for $($audio.id)"
    }
    Assert-Check ($audio.status -ceq 'generated') "Audio status is not generated for $($audio.id)"
    Assert-Check ($audio.dialect.ToString().Contains($danqun)) "Audio dialect is not recorded as Danqun for $($audio.id)"
    Assert-Check ($audio.verifiedBy.ToString().Contains($danqun)) "Audio dialect is not confirmed as Danqun for $($audio.id)"
    Assert-Check (Test-Path -LiteralPath (Join-Path $root $audio.assetPath) -PathType Leaf) "Missing audio asset $($audio.assetPath)"
}

$sourceIds = @('1-4-1', '1-4-2')
Assert-Check (($data.sources.id -join ',') -ceq ($sourceIds -join ',')) 'Expected the two lesson-four sources'
foreach ($source in $data.sources) {
    Assert-Check ($source.title -and $source.url -match '^https://docs\.google\.com/document/d/' -and $readme.Contains($source.url)) "Missing source note for $($source.id)"
}
foreach ($collection in 'vocabulary', 'sentences', 'culture', 'questions') {
    Assert-Check ($data.$collection.Count -gt 0) "Missing or empty $collection"
    foreach ($entry in $data.$collection) {
        Assert-Check ($entry.sourceId -cin $sourceIds -and $entry.sourceNote) "Missing item source in $collection"
    }
}
foreach ($entry in @($data.vocabulary) + @($data.sentences)) {
    $entryLabel = if ($entry.term) { $entry.term } elseif ($entry.id) { $entry.id } else { $entry.text }
    Assert-Check ($entry.audioId -and ($data.audioAssets.id -contains $entry.audioId)) "Missing audio link for $entryLabel"
}

$imageFiles = @('lesson4-forest-background.png', 'lesson4-mole.png', 'lesson4-relationship-characters.png')
$app = Get-Content -LiteralPath (Join-Path $root 'app.js') -Raw -Encoding UTF8
$styles = Get-Content -LiteralPath (Join-Path $root 'styles.css') -Raw -Encoding UTF8
$assetReferences = "$html`n$js`n$app`n$styles"
foreach ($image in $imageFiles) {
    Assert-Check (Test-Path -LiteralPath (Join-Path $root "assets/images/$image") -PathType Leaf) "Missing image asset $image"
    Assert-Check ($assetReferences.Contains($image)) "Image asset is not integrated: $image"
}
Assert-Check (($data.vocabulary + $data.sentences | ConvertTo-Json -Depth 10) -notmatch 'imageText|textSource') 'Image file is used as a text source'
$words = @('simaq', 'aak', 'aas', 'aipun', 'ainkun', "tais'aan", 'tama')
Assert-Check ((($data.vocabulary.term | Sort-Object) -join ',') -ceq (($words | Sort-Object) -join ',')) 'Vocabulary differs from the approved list'

$points = @('word-meaning', 'pronouns', 'sentence-pattern', 'listening', 'culture')
$levels = @('word-mole', 'listen-match', 'sentence-order', 'greeting-challenge')
Assert-Check (($data.knowledgePoints.id -join ',') -ceq ($points -join ',')) 'Expected five knowledge points'
Assert-Check (($data.levels.id -join ',') -ceq ($levels -join ',')) 'Expected four levels'
foreach ($level in $levels) {
    Assert-Check ($html -match "id=""$level""" -and $data.questions.levelId -ccontains $level) "Missing map item or question for $level"
}
foreach ($point in $points) {
    Assert-Check ($data.questions.knowledgePoint -ccontains $point) "Missing question for $point"
}
Assert-Check (($data.questions.id | Sort-Object -Unique).Count -eq $data.questions.Count) 'Duplicate question IDs'
foreach ($question in $data.questions) {
    foreach ($field in 'id', 'knowledgePoint', 'prompt', 'options', 'answer', 'explanation', 'repairModule') {
        Assert-Check ($question.$field) "Question missing $field"
    }
    Assert-Check ($question.knowledgePoint -cin $points -and $question.levelId -cin $levels) "Unrecognized knowledge point or level for $($question.id)"
    Assert-Check ($question.repairModule -cin @('vocabulary', 'sentences', 'listening', 'culture')) "Unrecognized repair module for $($question.id)"
    Assert-Check ($question.options.Count -ge 2) "Missing options for $($question.id)"
    if ($question.levelId -ceq 'sentence-order' -or $question.mode -ceq 'sentence-build') {
        $sentence = $data.sentences | Where-Object { $_.id -ceq $question.sentenceId }
        Assert-Check ($sentence -and $sentence.text -ceq $question.answer) "Ordering answer differs from source sentence for $($question.id)"
        $tiles = ($question.options | Sort-Object) -join ' '
        $answerWords = ($question.answer.Split(' ') | Sort-Object) -join ' '
        Assert-Check ($tiles -ceq $answerWords) "Tiles do not match the answer for $($question.id)"
    } else {
        Assert-Check ($question.options -ccontains $question.answer) "Answer is not an option for $($question.id)"
    }
}

Write-Output 'PASS: independent lesson shell, source notes, five knowledge points, four levels, and question contracts'
