document.addEventListener('DOMContentLoaded', function () {
    const cycleSelect = document.getElementById('cycle-select');
    const subjectSelect = document.getElementById('subject-select');
    const sectionSelect = document.getElementById('section-select');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const scheduleTable = document.getElementById('schedule-table');
    const colorPickerBtn = document.getElementById('color-picker-btn');
    const colorPicker = document.getElementById('color-picker');
    const exportImageBtn = document.getElementById('export-image-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const careerSelect = document.getElementById('career-select');
    const careerData = {};
    const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    fetch('carreras/Fisi.json')
        .then(response => response.json())
        .then(horariosData => {
            createScheduleTable();

            careerSelect.insertAdjacentHTML('afterbegin', '<option value="">---</option>');
            for (const career in horariosData) {
                const option = document.createElement('option');
                option.value = career;
                option.textContent = career;
                careerSelect.appendChild(option);

                // Almacenar los datos de la carrera en el objeto careerData
                careerData[career] = horariosData[career];
            }

            // Evento al seleccionar una carrera
            careerSelect.addEventListener('change', updateCycles);

            // Eventos al seleccionar un ciclo y una asignatura
            cycleSelect.addEventListener('change', updateSubjects);
            subjectSelect.addEventListener('change', updateSections);

            // Habilitar el botón "Agregar Horario" cuando todas las selecciones estén completas
            sectionSelect.addEventListener('change', () => {
                addScheduleBtn.disabled = !(cycleSelect.value && subjectSelect.value && sectionSelect.value);
            });

            // Mostrar el selector de color al hacer clic en el botón
            colorPicker.addEventListener('input', () => {
                // Obtener el color seleccionado
                const selectedColor = colorPicker.value;
                // Puedes hacer cualquier cosa con el color seleccionado aquí
            });
            // Agregar horario a la tabla
            addScheduleBtn.addEventListener('click', addSchedule);

            // Exportar a imagen
            exportImageBtn.addEventListener('click', exportToImage);

            // Exportar a Excel
            exportExcelBtn.addEventListener('click', exportToExcel);

            function updateCycles() {
                const selectedCareer = careerSelect.value;
                const selectedCareerData = careerData[selectedCareer];
            
                // Limpiar y agregar la opción por defecto "---" al selector de ciclo
                cycleSelect.innerHTML = '';
                const defaultCycleOption = document.createElement('option');
                defaultCycleOption.value = '';
                defaultCycleOption.textContent = '---';
                cycleSelect.appendChild(defaultCycleOption);
            
                subjectSelect.innerHTML = '';
                sectionSelect.innerHTML = '';
            
                if (selectedCareerData) {
                    for (const cycle in selectedCareerData) {
                        const option = document.createElement('option');
                        option.value = cycle;
                        option.textContent = cycle;
                        cycleSelect.appendChild(option);
                    }
                }
            
                updateSubjects();
            }

            function updateSubjects() {
                const selectedCareer = careerSelect.value;
                const selectedCycle = cycleSelect.value;

                subjectSelect.innerHTML = '';
                sectionSelect.innerHTML = '';

                const subjectsSet = new Set();

                if (selectedCareer && selectedCycle) {
                    const coursesInCycle = careerData[selectedCareer][selectedCycle];

                    if (coursesInCycle) {
                        coursesInCycle.forEach(courseSection => {
                            subjectsSet.add(courseSection['Asignatura']);
                        });

                        const defaultOption = document.createElement('option');
                        defaultOption.value = '';
                        defaultOption.textContent = '---';
                        subjectSelect.appendChild(defaultOption);

                        subjectsSet.forEach(subject => {
                            const subjectOption = document.createElement('option');
                            subjectOption.value = subject;
                            subjectOption.textContent = subject;
                            subjectSelect.appendChild(subjectOption);
                        });
                    }
                }

                updateSections();
            }

            function updateSections() {
                const selectedCareer = careerSelect.value;
                const selectedCycle = cycleSelect.value;
                const selectedSubject = subjectSelect.value;

                sectionSelect.innerHTML = '';

                const sectionsSet = new Set();

                if (selectedCareer && selectedCycle && selectedSubject) {
                    const coursesInCycle = careerData[selectedCareer][selectedCycle];

                    if (coursesInCycle) {
                        coursesInCycle.forEach(courseSection => {
                            if (courseSection['Asignatura'] === selectedSubject) {
                                sectionsSet.add(courseSection['Sec.']);
                            }
                        });

                        sectionsSet.forEach(section => {
                            const sectionOption = document.createElement('option');
                            sectionOption.value = section;
                            sectionOption.textContent = section;
                            sectionSelect.appendChild(sectionOption);
                        });
                    }
                }

                addScheduleBtn.disabled = !(selectedCycle && selectedSubject && sectionSelect.value);
            }

            function addSchedule() {
                const selectedCareer = careerSelect.value;
                const selectedCycle = cycleSelect.value;
                const selectedSubject = subjectSelect.value;
                const selectedSection = sectionSelect.value;
                const selectedColor = colorPicker.value;

                let conflictoEncontrado = false;

                const coursesInCycle = careerData[selectedCareer][selectedCycle];

                if (coursesInCycle) {
                    coursesInCycle.forEach(courseInfo => {
                        if (courseInfo['Asignatura'] === selectedSubject && courseInfo['Sec.'] === selectedSection && courseInfo.Horarios) {
                            courseInfo.Horarios.forEach(schedule => {
                                const dayName = schedule.Día.trim().toUpperCase();
                                const dayIndex = days.findIndex(day => day.toUpperCase() === dayName || day.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === dayName);

                                if (dayIndex !== -1) {
                                    const startTime = parseInt(schedule.Inicio.split(':')[0], 10) + 1;
                                    const endTime = parseInt(schedule.Fin.split(':')[0], 10) + 1;

                                    for (let hour = startTime; hour < endTime; hour++) {
                                        const cell = scheduleTable.rows[hour - 8].cells[dayIndex + 1];

                                        console.log(`Checking cell at ${days[dayIndex]}, ${hour}:00`);

                                        if (cell.textContent.trim().length === 0) {
                                            cell.textContent = `${selectedSubject} - ${selectedSection}`;
                                            cell.classList.add('schedule-cell');
                                            cell.style.backgroundColor = selectedColor;
                                            cell.dataset.color = selectedColor;
                                        } else {
                                            console.log(`Conflict at ${days[dayIndex]}, ${hour}:00. Content: "${cell.textContent}"`);
                                            conflictoEncontrado = true;
                                        }
                                    }
                                } else {
                                    console.error('Día no válido en el horario:', schedule.Día);
                                    alert(`Error al agregar el horario. Día no válido: ${schedule.Día}`);
                                    return;
                                }
                            });
                        }
                    });
                }

                if (conflictoEncontrado) {
                    console.error('Conflicto de horarios. No se pudo agregar el horario.');
                    alert('Conflicto de horarios. No se pudo agregar el horario.');
                    return;
                }
            }

            function exportToImage() {
                html2canvas(document.getElementById('schedule-table')).then(function (canvas) {
                    var link = document.createElement('a');
                    link.href = canvas.toDataURL();
                    link.download = 'horarios.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            }

            function exportToExcel() {
                const wb = XLSX.utils.table_to_book(scheduleTable, { sheet: 'Horarios' });
                XLSX.writeFile(wb, 'horarios.xlsx');
            }

            function createScheduleTable() {
                const intervals = Array.from({ length: 14 }, (_, i) => i + 8);

                const headerRow = scheduleTable.insertRow(0);
                headerRow.insertCell(0);

                days.forEach(day => {
                    const headerCell = headerRow.insertCell();
                    headerCell.textContent = day;
                });

                intervals.forEach(interval => {
                    const row = scheduleTable.insertRow();
                    const intervalCell = row.insertCell(0);
                    intervalCell.textContent = `${interval}:00 - ${interval + 1}:00`;

                    days.forEach(day => {
                        const cell = row.insertCell();
                        cell.classList.add('schedule-cell');
                        cell.textContent = '';
                    });
                });
            }
        })
        .catch(error => console.error('Error al cargar el archivo JSON:', error));
});
