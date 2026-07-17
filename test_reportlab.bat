@echo off
echo Testing ReportLab PDF Generator...
echo.

cd /d "%~dp0backend"

echo Activating virtual environment (if exists)...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo Virtual environment activated
) else (
    echo No virtual environment found, using system Python
)

echo.
echo Running ReportLab PDF test...
python test_reportlab_pdf_generator.py

echo.
echo Test completed. Check the output above for results.
echo If a test_report.pdf file was created, the PDF generator is working!

pause