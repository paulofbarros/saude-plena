document.addEventListener('DOMContentLoaded', () => {
    const progressForm = document.getElementById('progressForm');
    const progressList = document.getElementById('progressList');
    const noRecordsMessage = document.getElementById('noRecordsMessage');
    const metricsSummary = document.getElementById('metricsSummary');

    let records = JSON.parse(localStorage.getItem('healthRecords')) || [];

    // Variáveis para os gráficos
    let weightChart, stepsChart, sleepChart;

    // Função para renderizar registros e atualizar gráficos
    function renderRecordsAndCharts() {
        progressList.innerHTML = ''; // Clear existing records
        if (records.length === 0) {
            noRecordsMessage.style.display = 'block';
        } else {
            noRecordsMessage.style.display = 'none';
            // Sort records by date in descending order for the list
            const sortedRecordsForList = [...records].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

            sortedRecordsForList.forEach((record, index) => {
                const recordItem = document.createElement('div');
                recordItem.classList.add('progress-item');

                // Formatar a exibição para incluir os novos campos
                let recordText = `
                    <strong>Data:</strong> ${record.recordDate} |
                    <strong>Peso:</strong> ${record.weight}kg |
                    <strong>Passos:</strong> ${record.steps !== null ? record.steps : 'N/A'} |
                    <strong>Sono:</strong> ${record.sleepHours !== null ? record.sleepHours + 'h' : 'N/A'} |
                    <strong>Treino Força:</strong> ${record.strengthTraining === 'yes' ? 'Sim' : 'Não'}
                `;
                if (record.trainingNotes) {
                    recordText += ` | <strong>Notas Treino:</strong> ${record.trainingNotes}`;
                }
                recordText += ` | <strong>Proteína:</strong> ${record.proteinIntake}`;
                if (record.foodNotes) {
                    recordText += ` | <strong>Notas Alimentação:</strong> ${record.foodNotes}`;
                }


                recordItem.innerHTML = `
                    <span>${recordText}</span>
                    <button data-id="${record.id}">Remover</button>
                `;
                progressList.appendChild(recordItem);
            });
        }
        updateCharts();
        updateMetricsSummary();
    }

    // Função para atualizar os gráficos (sem alterações significativas aqui, pois os novos campos não são numéricos)
    function updateCharts() {
        if (records.length === 0) {
            // Destruir gráficos se não houver dados
            if (weightChart) weightChart.destroy();
            if (stepsChart) stepsChart.destroy();
            if (sleepChart) sleepChart.destroy();
            return; // Sai da função se não há dados
        }

        const sortedRecords = [...records].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));

        const dates = sortedRecords.map(record => {
            const date = new Date(record.recordDate);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        });
        const weights = sortedRecords.map(record => record.weight);
        const steps = sortedRecords.map(record => record.steps);
        const sleepHours = sortedRecords.map(record => record.sleepHours);

        // Destruir gráficos existentes para evitar duplicidade
        if (weightChart) weightChart.destroy();
        if (stepsChart) stepsChart.destroy();
        if (sleepChart) sleepChart.destroy();

        // Gráfico de Peso
        const ctxWeight = document.getElementById('weightChart').getContext('2d');
        weightChart = new Chart(ctxWeight, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Peso (kg)',
                    data: weights,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });

        // Gráfico de Passos
        const ctxSteps = document.getElementById('stepsChart').getContext('2d');
        stepsChart = new Chart(ctxSteps, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Passos Diários',
                    data: steps,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de Horas de Sono
        const ctxSleep = document.getElementById('sleepChart').getContext('2d');
        sleepChart = new Chart(ctxSleep, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Horas de Sono',
                    data: sleepHours,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Função para atualizar o resumo de métricas
    function updateMetricsSummary() {
        if (records.length === 0) {
            metricsSummary.innerHTML = '<p>Adicione registros para ver as métricas!</p>';
            return;
        }

        // Ordena os registros para que o mais recente (índice 0) e o mais antigo (último índice) sejam acessíveis
        const sortedRecordsByDate = [...records].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

        const initialWeight = sortedRecordsByDate[sortedRecordsByDate.length - 1].weight;
        const currentWeight = sortedRecordsByDate[0].weight;
        const totalWeightChange = (currentWeight - initialWeight).toFixed(1); // Mudança total de peso

        // Para perda de peso, podemos querer um valor positivo se perdeu peso
        const totalWeightLoss = (initialWeight - currentWeight).toFixed(1);


        const avgSteps = records.reduce((sum, record) => sum + (record.steps || 0), 0) / records.length;
        const avgSleepHours = records.reduce((sum, record) => sum + (record.sleepHours || 0), 0) / records.length;

        const strengthTrainingCount = records.filter(record => record.strengthTraining === 'yes').length;
        const proteinHighCount = records.filter(record => record.proteinIntake === 'high').length;
        const proteinMediumCount = records.filter(record => record.proteinIntake === 'medium').length;
        const proteinLowCount = records.filter(record => record.proteinIntake === 'low').length;

        metricsSummary.innerHTML = `
            <p><strong>Peso Inicial Registrado:</strong> ${initialWeight}kg</p>
            <p><strong>Peso Atual:</strong> ${currentWeight}kg</p>
            <p><strong>Variação de Peso Total:</strong> ${totalWeightChange > 0 ? '+' : ''}${totalWeightChange}kg ${totalWeightLoss > 0 ? `(Perda: ${totalWeightLoss}kg)` : ''}</p>
            <p><strong>Média Diária de Passos:</strong> ${avgSteps.toFixed(0)} passos</p>
            <p><strong>Média de Horas de Sono:</strong> ${avgSleepHours.toFixed(1)}h</p>
            <p><strong>Total de Treinos de Força Registrados:</strong> ${strengthTrainingCount}</p>
            <p><strong>Consumo de Proteína:</strong> Alto (${proteinHighCount}) / Médio (${proteinMediumCount}) / Baixo (${proteinLowCount})</p>
        `;
    }


    // Handle form submission
    progressForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const newRecord = {
            id: Date.now(), // Adiciona um ID único para fácil remoção
            recordDate: document.getElementById('recordDate').value,
            weight: parseFloat(document.getElementById('weight').value),
            steps: document.getElementById('steps').value ? parseInt(document.getElementById('steps').value, 10) : null,
            sleepHours: document.getElementById('sleepHours').value ? parseFloat(document.getElementById('sleepHours').value) : null,
            strengthTraining: document.getElementById('strengthTraining').value,
            trainingNotes: document.getElementById('trainingNotes').value.trim(), // Novo campo
            proteinIntake: document.getElementById('proteinIntake').value,
            foodNotes: document.getElementById('foodNotes').value.trim() // Novo campo
        };

        records.push(newRecord);
        localStorage.setItem('healthRecords', JSON.stringify(records)); // Save to localStorage
        renderRecordsAndCharts(); // Re-render the list and charts

        progressForm.reset(); // Clear the form
        // Set default date to today for convenience
        document.getElementById('recordDate').valueAsDate = new Date();
    });

    // Handle record deletion
    progressList.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Remover') {
            const recordIdToRemove = parseInt(event.target.dataset.id);
            records = records.filter(record => record.id !== recordIdToRemove); // Filter out the record
            localStorage.setItem('healthRecords', JSON.stringify(records)); // Update localStorage
            renderRecordsAndCharts(); // Re-render the list and charts
        }
    });

    // Initialize: set today's date and render any existing records
    document.getElementById('recordDate').valueAsDate = new Date();
    renderRecordsAndCharts(); // Initial render
});
