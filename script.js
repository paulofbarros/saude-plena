document.addEventListener('DOMContentLoaded', () => {
    const progressForm = document.getElementById('progressForm');
    const progressList = document.getElementById('progressList');
    const noRecordsMessage = document.getElementById('noRecordsMessage');
    const metricsSummary = document.getElementById('metricsSummary');
    const strengthTrainingSelect = document.getElementById('strengthTraining');
    const strengthDetailsDiv = document.getElementById('strengthDetails');

    let records = JSON.parse(localStorage.getItem('healthRecords')) || [];

    // Variáveis para os gráficos (agora sem massa muscular e gordura)
    let weightChart, imcChart, stepsChart, sleepChart, squatsChart, deadliftsChart;

    // Listener para mostrar/ocultar detalhes do treino de força
    strengthTrainingSelect.addEventListener('change', () => {
        if (strengthTrainingSelect.value === 'yes') {
            strengthDetailsDiv.style.display = 'block';
        } else {
            strengthDetailsDiv.style.display = 'none';
            // Opcional: Limpar campos quando ocultar
            document.getElementById('squatsWeight').value = '';
            document.getElementById('squatsReps').value = '';
            document.getElementById('deadliftsWeight').value = '';
            document.getElementById('deadliftsReps').value = '';
            document.getElementById('benchPressWeight').value = '';
            document.getElementById('benchPressReps').value = '';
            document.getElementById('rowsWeight').value = '';
            document.getElementById('rowsReps').value = '';
        }
    });

    // Função para renderizar registros e atualizar gráficos
    function renderRecordsAndCharts() {
        progressList.innerHTML = ''; // Clear existing records
        if (records.length === 0) {
            noRecordsMessage.style.display = 'block';
        } else {
            noRecordsMessage.style.display = 'none';
            // Sort records by date in descending order for the list
            const sortedRecordsForList = [...records].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

            sortedRecordsForList.forEach((record) => {
                const recordItem = document.createElement('div');
                recordItem.classList.add('progress-item');

                // Formatar a exibição para incluir os novos campos
                let recordText = `
                    <strong>Data:</strong> ${record.recordDate} |
                    <strong>Altura:</strong> ${record.height !== null ? record.height + 'cm' : 'N/A'} |
                    <strong>Peso:</strong> ${record.weight}kg
                `;
                // IMC agora é a principal métrica de composição
                if (record.imc !== null) recordText += ` | <strong>IMC:</strong> ${record.imc.toFixed(1)} (${getIMCCategory(record.imc)})`;

                recordText += ` | <strong>Passos:</strong> ${record.steps !== null ? record.steps : 'N/A'} |
                    <strong>Sono:</strong> ${record.sleepHours !== null ? record.sleepHours + 'h' : 'N/A'} |
                    <strong>Treino Força:</strong> ${record.strengthTraining === 'yes' ? 'Sim' : 'Não'}
                `;

                if (record.strengthTraining === 'yes') {
                    if (record.squatsWeight || record.squatsReps) recordText += ` | Agachamento: ${record.squatsWeight || 'N/A'}kg (${record.squatsReps || 'N/A'})`;
                    if (record.deadliftsWeight || record.deadliftsReps) recordText += ` | Terra: ${record.deadliftsWeight || 'N/A'}kg (${record.deadliftsReps || 'N/A'})`;
                    if (record.benchPressWeight || record.benchPressReps) recordText += ` | Supino: ${record.benchPressWeight || 'N/A'}kg (${record.benchPressReps || 'N/A'})`;
                    if (record.rowsWeight || record.rowsReps) recordText += ` | Remada: ${record.rowsWeight || 'N/A'}kg (${record.rowsReps || 'N/A'})`;
                }

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

    // Função auxiliar para categoria de IMC
    function getIMCCategory(imc) {
        if (imc < 18.5) return 'Abaixo do Peso';
        if (imc >= 18.5 && imc < 24.9) return 'Peso Normal';
        if (imc >= 25 && imc < 29.9) return 'Sobrepeso';
        if (imc >= 30 && imc < 34.9) return 'Obesidade Grau I';
        if (imc >= 35 && imc < 39.9) return 'Obesidade Grau II';
        return 'Obesidade Grau III';
    }


    // Função para atualizar os gráficos
    function updateCharts() {
        if (records.length === 0) {
            // Destruir gráficos se não houver dados
            if (weightChart) weightChart.destroy();
            if (imcChart) imcChart.destroy();
            if (stepsChart) stepsChart.destroy();
            if (sleepChart) sleepChart.destroy();
            if (squatsChart) squatsChart.destroy();
            if (deadliftsChart) deadliftsChart.destroy();

            // Ocultar containers de gráficos de força/composição se não houver dados
            document.getElementById('imcChart').parentNode.style.display = 'none'; // Parent node é a chart-box
            document.getElementById('squatsChartContainer').style.display = 'none';
            document.getElementById('deadliftsChartContainer').style.display = 'none';
            return;
        }

        const sortedRecords = [...records].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));

        const dates = sortedRecords.map(record => {
            const date = new Date(record.recordDate);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        });
        const weights = sortedRecords.map(record => record.weight);
        const imcs = sortedRecords.map(record => record.imc); // Já calculados no newRecord
        const steps = sortedRecords.map(record => record.steps);
        const sleepHours = sortedRecords.map(record => record.sleepHours);
        const squatsWeights = sortedRecords.map(record => record.squatsWeight || null);
        const deadliftsWeights = sortedRecords.map(record => record.deadliftsWeight || null);

        // Destruir gráficos existentes para evitar duplicidade
        if (weightChart) weightChart.destroy();
        if (imcChart) imcChart.destroy();
        if (stepsChart) stepsChart.destroy();
        if (sleepChart) sleepChart.destroy();
        if (squatsChart) squatsChart.destroy();
        if (deadliftsChart) deadliftsChart.destroy();


        // --- Gráficos Principais ---
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

        // Gráfico de IMC (renderiza apenas se houver dados)
        const hasImcData = imcs.some(val => val !== null);
        document.getElementById('imcChart').parentNode.style.display = hasImcData ? 'block' : 'none';
        if (hasImcData) {
            const ctxImc = document.getElementById('imcChart').getContext('2d');
            imcChart = new Chart(ctxImc, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'IMC',
                        data: imcs,
                        borderColor: 'rgb(255, 205, 86)',
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
        }

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

        // Gráficos de Força (renderizam apenas se houver dados)
        const hasSquatsData = squatsWeights.some(val => val !== null);
        const hasDeadliftsData = deadliftsWeights.some(val => val !== null);

        document.getElementById('squatsChartContainer').style.display = hasSquatsData ? 'block' : 'none';
        document.getElementById('deadliftsChartContainer').style.display = hasDeadliftsData ? 'block' : 'none';


        if (hasSquatsData) {
            const ctxSquats = document.getElementById('squatsChart').getContext('2d');
            squatsChart = new Chart(ctxSquats, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Agachamento (kg)',
                        data: squatsWeights,
                        borderColor: 'rgb(255, 159, 64)',
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
        }

        if (hasDeadliftsData) {
            const ctxDeadlifts = document.getElementById('deadliftsChart').getContext('2d');
            deadliftsChart = new Chart(ctxDeadlifts, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Levantamento Terra (kg)',
                        data: deadliftsWeights,
                        borderColor: 'rgb(153, 102, 255)',
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
        }
    }

    // Função para atualizar o resumo de métricas
    function updateMetricsSummary() {
        if (records.length === 0) {
            metricsSummary.innerHTML = '<p>Adicione registros para ver as métricas!</p>';
            return;
        }

        const sortedRecordsByDate = [...records].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate)); // Mais recente primeiro

        const initialRecord = sortedRecordsByDate[sortedRecordsByDate.length - 1]; // Registro mais antigo
        const currentRecord = sortedRecordsByDate[0]; // Registro mais recente

        const initialWeight = initialRecord.weight;
        const currentWeight = currentRecord.weight;
        const totalWeightChange = (currentWeight - initialWeight).toFixed(1);
        const totalWeightLoss = (initialWeight - currentWeight).toFixed(1);

        const initialHeight = initialRecord.height;
        const currentHeight = currentRecord.height;

        const initialImc = initialRecord.imc;
        const currentImc = currentRecord.imc;

        const avgSteps = records.reduce((sum, record) => sum + (record.steps || 0), 0) / records.length;
        const avgSleepHours = records.reduce((sum, record) => sum + (record.sleepHours || 0), 0) / records.length;

        const strengthTrainingCount = records.filter(record => record.strengthTraining === 'yes').length;
        const proteinHighCount = records.filter(record => record.proteinIntake === 'high').length;
        const proteinMediumCount = records.filter(record => record.proteinIntake === 'medium').length;
        const proteinLowCount = records.filter(record => record.proteinIntake === 'low').length;

        const allSquatsWeights = records.map(record => record.squatsWeight || 0).filter(w => w > 0);
        const maxSquatsWeight = allSquatsWeights.length > 0 ? Math.max(...allSquatsWeights) : 'N/A';

        const allDeadliftsWeights = records.map(record => record.deadliftsWeight || 0).filter(w => w > 0);
        const maxDeadliftsWeight = allDeadliftsWeights.length > 0 ? Math.max(...allDeadliftsWeights) : 'N/A';

        // --- Novas Estimativas de Calorias Perdidas ---
        const CALORIES_PER_STEP = 0.04; // Estimativa de calorias por passo
        const CALORIES_PER_STRENGTH_TRAINING_SESSION = 400; // Estimativa de calorias por sessão de treino de força

        let totalEstimatedCaloriesBurned = 0;
        let totalEstimatedCaloriesFromSteps = 0;
        let totalEstimatedCaloriesFromStrength = 0;

        records.forEach(record => {
            if (record.steps) {
                const caloriesFromSteps = record.steps * CALORIES_PER_STEP;
                totalEstimatedCaloriesFromSteps += caloriesFromSteps;
            }
            if (record.strengthTraining === 'yes') {
                totalEstimatedCaloriesFromStrength += CALORIES_PER_STRENGTH_TRAINING_SESSION;
            }
        });

        totalEstimatedCaloriesBurned = totalEstimatedCaloriesFromSteps + totalEstimatedCaloriesFromStrength;

        // Média diária de calorias queimadas por passos (somente se houver registros com passos)
        const totalStepsRecorded = records.filter(record => record.steps !== null && record.steps > 0).length;
        const avgDailyCaloriesFromSteps = totalStepsRecorded > 0 ? (totalEstimatedCaloriesFromSteps / totalStepsRecorded).toFixed(0) : 'N/A';


        metricsSummary.innerHTML = `
            <p><strong>Peso Inicial Registrado:</strong> ${initialWeight}kg</p>
            <p><strong>Peso Atual:</strong> ${currentWeight}kg</p>
            <p><strong>Variação de Peso Total:</strong> ${totalWeightChange > 0 ? '+' : ''}${totalWeightChange}kg ${totalWeightLoss > 0 && totalWeightLoss !== '0.0' ? `(Perda: ${totalWeightLoss}kg)` : ''}</p>
            ${initialHeight && currentHeight ? `<p><strong>Altura Registrada:</strong> ${currentHeight}cm</p>` : ''}
            ${initialImc && currentImc ? `<p><strong>IMC Inicial:</strong> ${initialImc.toFixed(1)} | <strong>IMC Atual:</strong> ${currentImc.toFixed(1)} (${getIMCCategory(currentImc)})</p>` : ''}
            <p><strong>Média Diária de Passos:</strong> ${avgSteps.toFixed(0)} passos</p>
            <p><strong>Média de Horas de Sono:</strong> ${avgSleepHours.toFixed(1)}h</p>
            <p><strong>Total de Treinos de Força Registrados:</strong> ${strengthTrainingCount}</p>
            ${maxSquatsWeight !== 'N/A' ? `<p><strong>Recorde Agachamento:</strong> ${maxSquatsWeight}kg</p>` : ''}
            ${maxDeadliftsWeight !== 'N/A' ? `<p><strong>Recorde Levantamento Terra:</strong> ${maxDeadliftsWeight}kg</p>` : ''}
            <p><strong>Consumo de Proteína:</strong> Alto (${proteinHighCount}) / Médio (${proteinMediumCount}) / Baixo (${proteinLowCount})</p>
            <br>
            <h3>Estimativa de Calorias Queimadas:</h3>
            <p><em>(Valores estimados e podem variar)</em></p>
            <p><strong>Média Diária (Passos):</strong> ${avgDailyCaloriesFromSteps !== 'N/A' ? avgDailyCaloriesFromSteps + ' kcal' : 'N/A'}</p>
            <p><strong>Total Estimado por Passos:</strong> ${totalEstimatedCaloriesFromSteps.toFixed(0)} kcal</p>
            <p><strong>Total Estimado por Treinos de Força:</strong> ${totalEstimatedCaloriesFromStrength.toFixed(0)} kcal</p>
            <p><strong>Total Geral Estimado:</strong> ${totalEstimatedCaloriesBurned.toFixed(0)} kcal</p>

        `;
    }

    // Handle form submission
    progressForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const heightCm = parseFloat(document.getElementById('height').value);
        const weightKg = parseFloat(document.getElementById('weight').value);
        let imc = null;
        if (weightKg && heightCm) {
            const heightM = heightCm / 100; // Converte cm para metros
            imc = weightKg / (heightM * heightM);
        }

        const newRecord = {
            id: Date.now(), // Adiciona um ID único para fácil remoção
            recordDate: document.getElementById('recordDate').value,
            height: heightCm || null,
            weight: weightKg,
            imc: imc, // Calculado aqui
            // Massa Muscular e Gordura Corporal removidos da coleta

            steps: document.getElementById('steps').value ? parseInt(document.getElementById('steps').value, 10) : null,
            sleepHours: document.getElementById('sleepHours').value ? parseFloat(document.getElementById('sleepHours').value) : null,
            strengthTraining: document.getElementById('strengthTraining').value,
            // Campos de força
            squatsWeight: document.getElementById('squatsWeight').value ? parseFloat(document.getElementById('squatsWeight').value) : null,
            squatsReps: document.getElementById('squatsReps').value.trim() || null,
            deadliftsWeight: document.getElementById('deadliftsWeight').value ? parseFloat(document.getElementById('deadliftsWeight').value) : null,
            deadliftsReps: document.getElementById('deadliftsReps').value.trim() || null,
            benchPressWeight: document.getElementById('benchPressWeight').value ? parseFloat(document.getElementById('benchPressWeight').value) : null,
            benchPressReps: document.getElementById('benchPressReps').value.trim() || null,
            rowsWeight: document.getElementById('rowsWeight').value ? parseFloat(document.getElementById('rowsWeight').value) : null,
            rowsReps: document.getElementById('rowsReps').value.trim() || null,

            trainingNotes: document.getElementById('trainingNotes').value.trim() || null,
            proteinIntake: document.getElementById('proteinIntake').value,
            foodNotes: document.getElementById('foodNotes').value.trim() || null
        };

        records.push(newRecord);
        localStorage.setItem('healthRecords', JSON.stringify(records)); // Save to localStorage
        renderRecordsAndCharts(); // Re-render the list and charts

        progressForm.reset(); // Clear the form
        // Set default date to today for convenience
        document.getElementById('recordDate').valueAsDate = new Date();
        strengthDetailsDiv.style.display = 'none'; // Oculta os detalhes de força novamente
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
    // Verifica o estado inicial do select de treino de força
    if (strengthTrainingSelect.value === 'yes') {
        strengthDetailsDiv.style.display = 'block';
    } else {
        strengthDetailsDiv.style.display = 'none';
    }
    renderRecordsAndCharts(); // Initial render
});
