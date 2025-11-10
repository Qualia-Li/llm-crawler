import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import queue
import time


class PnpmRunner:
    def __init__(self, root):
        self.root = root
        self.root.title("PNPM Runner")
        self.root.geometry("800x600")

        # Control variables
        self.is_running = False
        self.process = None
        self.retry_count = 0
        self.max_retries = 5  # Maximum number of retries
        self.output_queue = queue.Queue()

        self.setup_ui()
        self.update_output()

    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)

        # Title
        title_label = ttk.Label(main_frame, text="PNPM Run Manager", font=('Arial', 16))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 10))

        # Controls frame
        controls_frame = ttk.Frame(main_frame)
        controls_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))

        # Start button
        self.start_button = ttk.Button(controls_frame, text="Start", command=self.toggle_process)
        self.start_button.grid(row=0, column=0, padx=(0, 10))

        # Stop button
        self.stop_button = ttk.Button(controls_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.grid(row=0, column=1, padx=(0, 10))

        # Retry counter label
        self.retry_label = ttk.Label(controls_frame, text="Retries: 0")
        self.retry_label.grid(row=0, column=2, padx=(0, 10))

        # Auto-retry checkbox
        self.auto_retry_var = tk.BooleanVar(value=True)
        self.auto_retry_cb = ttk.Checkbutton(controls_frame, text="Auto-retry on error",
                                             variable=self.auto_retry_var)
        self.auto_retry_cb.grid(row=0, column=3, padx=(0, 10))

        # Status label
        self.status_label = ttk.Label(controls_frame, text="Status: Stopped")
        self.status_label.grid(row=0, column=4)

        # Log output area
        log_label = ttk.Label(main_frame, text="Output Log:")
        log_label.grid(row=2, column=0, sticky=tk.W, pady=(10, 0))

        self.log_text = scrolledtext.ScrolledText(main_frame, width=80, height=25,
                                                  wrap=tk.WORD, font=('Consolas', 10))
        self.log_text.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(5, 0))

        # Clear log button
        clear_button = ttk.Button(main_frame, text="Clear Log", command=self.clear_log)
        clear_button.grid(row=4, column=0, pady=(10, 0), sticky=tk.W)

    def toggle_process(self):
        if not self.is_running:
            self.start_process()
        else:
            self.stop_process()

    def start_process(self):
        self.is_running = True
        self.retry_count = 0
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.update_status("Starting...")

        # Start the process in a separate thread
        thread = threading.Thread(target=self.run_pnpm, daemon=True)
        thread.start()

    def stop_process(self):
        self.is_running = False
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.update_status("Stopped")

        # Terminate the process if it's running
        if self.process:
            try:
                self.process.terminate()
            except:
                pass

    def run_pnpm(self):
        while self.is_running and self.retry_count <= self.max_retries:
            try:
                self.output_queue.put(f"\n--- Starting pnpm run run (Attempt {self.retry_count + 1}) ---\n")

                # Run pnpm command
                self.process = subprocess.Popen(
                    [r'powershell', '-Command', 'pnpm.cmd run run'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    universal_newlines=True
                )

                # Read output in real-time
                for line in iter(self.process.stdout.readline, ''):
                    if not self.is_running:
                        break
                    self.output_queue.put(line)

                # Wait for process to complete
                self.process.wait()

                # Check exit code
                if self.process.returncode == 0:
                    self.output_queue.put(f"\n--- Process completed successfully ---\n")
                    self.is_running = False
                    self.root.after(0, self.on_process_success)
                    break
                else:
                    self.output_queue.put(f"\n--- Process failed with exit code {self.process.returncode} ---\n")
                    self.retry_count += 1

                    if self.auto_retry_var.get() and self.retry_count <= self.max_retries and self.is_running:
                        self.output_queue.put(
                            f"Auto-retrying in 3 seconds... ({self.retry_count}/{self.max_retries})\n")
                        time.sleep(3)
                    else:
                        self.is_running = False
                        self.root.after(0, self.on_process_failure)
                        break

            except Exception as e:
                self.output_queue.put(f"\n--- Error: {str(e)} ---\n")
                self.retry_count += 1

                if self.auto_retry_var.get() and self.retry_count <= self.max_retries and self.is_running:
                    self.output_queue.put(f"Auto-retrying in 3 seconds... ({self.retry_count}/{self.max_retries})\n")
                    time.sleep(3)
                else:
                    self.is_running = False
                    self.root.after(0, self.on_process_failure)
                    break

    def on_process_success(self):
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.update_status("Completed Successfully")

    def on_process_failure(self):
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.update_status(f"Failed after {self.retry_count} attempts")

    def update_status(self, message):
        self.status_label.config(text=f"Status: {message}")
        self.retry_label.config(text=f"Retries: {self.retry_count}")

    def update_output(self):
        # Update the log text widget with new output
        while not self.output_queue.empty():
            try:
                line = self.output_queue.get_nowait()
                self.log_text.insert(tk.END, line)
                self.log_text.see(tk.END)
            except queue.Empty:
                break

        # Schedule the next update
        self.root.after(100, self.update_output)

    def clear_log(self):
        self.log_text.delete(1.0, tk.END)


def main():
    root = tk.Tk()
    app = PnpmRunner(root)
    root.mainloop()


if __name__ == "__main__":
    main()