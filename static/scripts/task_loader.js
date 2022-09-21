window.addEventListener("load", async () => {

    let tasks = [];

    try {
        // Initialize Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        } else {
            console.error("Could not initialize service worker...");
        }
    } catch (err) {
        console.error(err);
        console.log("Could not initialize service worker...");
    }

    // Get task container
    const task_container = document.getElementById("tasks");

    // Function to update the task data
    const update_tasks = () => {
        return new Promise((resolve, reject) => {
            const data = {
                tasks
            };
            const req = new XMLHttpRequest();
            req.open("POST", "/tasks");
            req.onreadystatechange = () => {
                if (req.readyState == XMLHttpRequest.DONE) {
                    console.log(`update_status: ${req.status}`);
                    if (Math.floor(req.status / 100) == 2) {
                        resolve();
                    } else {
                        reject(new Error(`[${req.status}]: ${req.statusText}`));
                    }
                }
            };
            req.setRequestHeader("Content-Type", "application/json");
            req.send(JSON.stringify(data));
        });
    };

    // Setup complete task toggle
    const complete_toggle_btn = document.getElementById("completed-toggle-btn");
    const toggle_completed = (toggle) => {
        complete_toggle_btn.classList.toggle("checked", toggle);
        const show = complete_toggle_btn.classList.contains("checked");
        task_container.classList.toggle("hide-completed", !show);
        localStorage.setItem("show_completed", show ? "true" : "false");
    };
    complete_toggle_btn.addEventListener("click", () => { toggle_completed(); });
    toggle_completed(localStorage.getItem("show_completed") === "true");

    // Setup task addition
    const add_task = async (task) => {
        try {
            tasks.unshift(task);
            await update_tasks(tasks);
            await refresh_tasks();
        } catch (err) {
            console.error(err);
        }
    }
    const new_task_btn = document.getElementById("new-task-btn");
    const new_task_input = document.getElementById("new-task-input");
    const add_new_task = async () => {
        if (new_task_input.value.length > 0) {
            await add_task({
                name: new_task_input.value,
                added: Date.now(),
                completed: false
            });
            new_task_input.value = "";
        } else {
            window.alert("Task name cannot be empty");
        }
    };
    new_task_btn.addEventListener("click", add_new_task);
    new_task_input.addEventListener("keydown", (e) => { if (e.key.toUpperCase() === "ENTER") add_new_task(); });

    // Function to create a task html object
    const append_task = (task, index) => {

        const elem = document.createElement("div");
        elem.classList.add("task");
        elem.draggable = true;
        elem.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/plain", "" + index);
            ev.dataTransfer.dropEffect = "move";
            task_container.classList.add("dragging");
        });
        elem.addEventListener("dragend", ev => {
            task_container.classList.remove("dragging");
        });
        elem.addEventListener("dragover", (ev) => {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "move";
            elem.classList.add("drag-over");
        });
        elem.addEventListener("dragleave", (ev) => {
            elem.classList.remove("drag-over");
        });
        elem.addEventListener("drop", async (ev) => {
            ev.preventDefault();

            // Get the id of the target and add the moved element to the target's DOM
            const droppedIndex = parseInt(ev.dataTransfer.getData("text/plain"));
            if(droppedIndex != index) {

                // Swap indexes and update tasks:
                console.log(`Moving ${droppedIndex} to ${index}`);
                const temp = tasks[droppedIndex];
                if(droppedIndex > index) {
                    for(let i = droppedIndex; i > index; i--){
                        tasks[i] = tasks[i - 1];
                    }
                } else {
                    for(let i = droppedIndex; i < index; i++){
                        tasks[i] = tasks[i + 1];
                    }
                }
                tasks[index] = temp;
                await update_tasks();
                await refresh_tasks();
            }
        });
        if (task.completed) elem.classList.add("completed");

        const checkbox = document.createElement("div");
        checkbox.classList.add("checkbox");
        if (task.completed) checkbox.classList.add("checked");
        checkbox.addEventListener("click", async () => {
            // Update completion status
            checkbox.classList.toggle("checked");
            const completed = checkbox.classList.contains("checked");
            elem.classList.toggle("completed", completed);
            task.completed = completed;
            await update_tasks();
            await refresh_tasks();
        });

        const name = document.createElement("input");
        name.classList.add("name");
        name.name = "task-name";
        name.type = "text";
        name.placeholder = "Task Name";
        name.value = task.name;
        name.addEventListener("change", async () => {
            // Update name
            task.name = name.value;
            await update_tasks();
            await refresh_tasks();
        });

        const delete_btn = document.createElement("i");
        delete_btn.title = "Delete";
        delete_btn.classList.add("icofont-bin");
        delete_btn.addEventListener("click", async () => {
            // Delete task
            console.log(`deleting task: ${task.name} at index: ${index}`)
            tasks.splice(index, 1);
            elem.remove();
            await update_tasks();
            await refresh_tasks();
        });

        // Append to elem
        elem.append(checkbox, name, delete_btn);

        // Append to tasks
        task_container.append(elem);

    }

    // Get tasks from server
    const get_tasks = () => {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.addEventListener("load", () => {
                if (Math.floor(req.status / 100) == 2) {
                    // Load tasks
                    const data = JSON.parse(req.responseText);
                    const tasks = data.tasks;
                    resolve(tasks);
                } else {
                    // Display status as error
                    reject(new Error(`[${req.status}]: ${req.statusText}`));
                }
            });
            req.addEventListener("error", () => {
                reject(new Error(`[${req.status}]: ${req.statusText}`));
            });
            req.open("GET", "/data/tasks.json");
            req.send();
        });
    }

    // Request task data and append to doc
    const refresh_tasks = async () => {
        // Get task list
        tasks = await get_tasks();
        console.log(tasks);
        // Delete old tasks
        task_container.innerHTML = "";
        // Append task list
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            append_task(task, i);
        }
    }

    // Add clear all button functionality:
    const clear_btn = document.getElementById("clear-all-btn");
    clear_btn.addEventListener("click", async () => {
        tasks = [];
        await update_tasks();
        await refresh_tasks();
    });

    // Init page
    await refresh_tasks();
    console.log("Tasks loaded!");

});