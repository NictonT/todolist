document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'farmakolojiTakipData';

    const topicsDefinition = [
      { id: 'kalsiyotrofik', name: 'Kalsiyotrofik İlaçlar' },
      { id: 'uriner-enfeksiyon', name: 'Uriner Enfeksiyon İlaçları' },
      { id: 'endokrin-giris', name: 'Endokrin Giriş' },
      { id: 'insulin-oral', name: 'İnsülin & Oral Antidiyabetikler' },
      { id: 'estrojenler-projestinler-1', name: 'Estrojenler, Projestinler, Antiesterojenikler, Oral Kontraseptifler' },
      { id: 'estrojenler-projestinler-2', name: 'Estrojenler, Projestinler... (Devamı/Ek)' },
      { id: 'kortikosteroidler-acth', name: 'Kortikosteroidler ve ACTH' },
      { id: 'oksitosik', name: 'Oksitosik İlaçlar' },
      { id: 'tiroid-ilaclari', name: 'Tiroid İlaçları' },
      { id: 'androjenler-steroidler', name: 'Androjenler, Anabolik Steroidler, Antiandrojenikler' },
      { id: 'hipofiz-hipotalamus', name: 'Hipofiz ve Hipotalamus Hormonları' },
      { id: 'vitamin-alternatif', name: 'Vitaminler & Alternatif Tıp' },
      { id: 'deneysel-hayvan', name: 'Tıbbi Farmakolojide Deneysel Hayvan Modelleri' }
    ];

    let savedTopics = [];

    const topicListEl = document.getElementById('topicList');
    const overallProgressBarEl = document.getElementById('overallProgressBar');
    const overallProgressTextEl = document.getElementById('overallProgressText');

    function loadTopics() {
        const dataFromStorage = localStorage.getItem(STORAGE_KEY);
        if (dataFromStorage) {
            const parsedData = JSON.parse(dataFromStorage);
            // Ensure all defined topics are present, merge if new topics added
            savedTopics = topicsDefinition.map(defTopic => {
                const found = parsedData.find(saved => saved.id === defTopic.id);
                return found || { ...defTopic, percentage: 0, summaryDone: false, memorized: false };
            });
        } else {
            savedTopics = topicsDefinition.map(topic => ({
                ...topic,
                percentage: 0,
                summaryDone: false,
                memorized: false
            }));
        }
    }

    function saveTopics() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTopics));
    }

    function renderTopics() {
        topicListEl.innerHTML = ''; // Clear existing topics
        savedTopics.forEach(topicData => {
            const topicItem = document.createElement('li');
            topicItem.classList.add('topic-item');
            topicItem.dataset.topicId = topicData.id;
             if (topicData.memorized && topicData.percentage === 100) {
                topicItem.classList.add('fully-mastered');
            }


            topicItem.innerHTML = `
                <div class="topic-header">
                    <span class="topic-name">${topicData.name}</span>
                </div>
                <div class="topic-body">
                    <div class="progress-section">
                        <label for="percentage-${topicData.id}">Tamamlanma Düzeyi:</label>
                        <div class="progress-input-area">
                            <input type="number" id="percentage-${topicData.id}" class="percentage-input" min="0" max="100" value="${topicData.percentage}">
                            <span>%</span>
                            <div class="progress-bar-container">
                                <div class="progress-bar" id="progressBar-${topicData.id}" style="width: ${topicData.percentage}%;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="checkbox-section">
                        <div class="control-group checkbox-group">
                            <input type="checkbox" id="summary-${topicData.id}" class="summary-checkbox" ${topicData.summaryDone ? 'checked' : ''}>
                            <label for="summary-${topicData.id}">Özet Yapıldı</label>
                        </div>
                        <div class="control-group checkbox-group">
                            <input type="checkbox" id="memorized-${topicData.id}" class="memorized-checkbox" ${topicData.memorized ? 'checked' : ''}>
                            <label for="memorized-${topicData.id}">Tam Anlaşıldı & Ezberlendi</label>
                        </div>
                    </div>
                </div>
            `;
            topicListEl.appendChild(topicItem);

            // Add event listeners for new elements
            const percentageInput = topicItem.querySelector(`#percentage-${topicData.id}`);
            percentageInput.addEventListener('input', (e) => handlePercentageChange(e, topicData.id));
            percentageInput.addEventListener('blur', (e) => handlePercentageBlur(e, topicData.id));


            const summaryCheckbox = topicItem.querySelector(`#summary-${topicData.id}`);
            summaryCheckbox.addEventListener('change', (e) => handleCheckboxChange(e, topicData.id, 'summaryDone'));

            const memorizedCheckbox = topicItem.querySelector(`#memorized-${topicData.id}`);
            memorizedCheckbox.addEventListener('change', (e) => handleCheckboxChange(e, topicData.id, 'memorized'));
        });
    }
    
    function handlePercentageBlur(event, topicId) {
        let value = parseInt(event.target.value, 10);
        if (isNaN(value) || value < 0) value = 0;
        if (value > 100) value = 100;
        event.target.value = value; // Correct the input field if out of bounds
        handlePercentageChange(event, topicId, true); // Force update with corrected value
    }


    function handlePercentageChange(event, topicId, forcedUpdate = false) {
        const topic = savedTopics.find(t => t.id === topicId);
        if (!topic) return;

        let value = parseInt(event.target.value, 10);
        
        if (!forcedUpdate) { // Only validate if not a forced update from blur
            if (isNaN(value)) { // If not a number, don't update immediately, wait for blur
                 return;
            }
        }
        // Clamp value if it's a valid number or forced
        if (isNaN(value) || value < 0) value = 0;
        if (value > 100) value = 100;


        topic.percentage = value;
        updateTopicProgressBar(topicId, value);
        updateOverallProgress();
        checkMasteredStatus(topicId);
        saveTopics();
    }

    function handleCheckboxChange(event, topicId, type) {
        const topic = savedTopics.find(t => t.id === topicId);
        if (!topic) return;

        topic[type] = event.target.checked;
        checkMasteredStatus(topicId);
        saveTopics();
    }
    
    function checkMasteredStatus(topicId) {
        const topic = savedTopics.find(t => t.id === topicId);
        const topicItemEl = document.querySelector(`.topic-item[data-topic-id="${topicId}"]`);
        if (topic && topicItemEl) {
            if (topic.memorized && topic.percentage === 100) {
                topicItemEl.classList.add('fully-mastered');
            } else {
                topicItemEl.classList.remove('fully-mastered');
            }
        }
    }


    function updateTopicProgressBar(topicId, percentage) {
        const progressBar = document.getElementById(`progressBar-${topicId}`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    function updateOverallProgress() {
        if (savedTopics.length === 0) {
            overallProgressBarEl.style.width = '0%';
            overallProgressTextEl.textContent = '0%';
            return;
        }
        const totalPercentageSum = savedTopics.reduce((sum, topic) => sum + topic.percentage, 0);
        const averagePercentage = totalPercentageSum / savedTopics.length;
        
        overallProgressBarEl.style.width = `${averagePercentage.toFixed(1)}%`;
        overallProgressTextEl.textContent = `${averagePercentage.toFixed(1)}%`;
    }

    // Initial setup
    loadTopics();
    renderTopics();
    updateOverallProgress();
    savedTopics.forEach(topic => checkMasteredStatus(topic.id)); // Initial check for mastered status
});
