# Effect of Image Quality Feedback on Fossil Photo Submissions in Citizen Science

<div align="center">

[![Project Page](https://img.shields.io/badge/Project-Page-2563eb?style=for-the-badge)](https://meganspielberg.github.io/fossil-ai-feedback/)
[![Paper](https://img.shields.io/badge/Paper-PDF-dc2626?style=for-the-badge)](https://meganspielberg.github.io/fossil-ai-feedback/static/pdfs/Research_Paper_LegaSea.pdf)
[![Poster](https://img.shields.io/badge/Poster-PDF-10b981?style=for-the-badge)](https://meganspielberg.github.io/fossil-ai-feedback/static/pdfs/ResearchPosterLegaSeaFinalV1.pdf)

</div>

---

<p align="center">
  <i>Master's project investigating real-time image quality feedback for citizen science fossil photography</i><br>
  Fontys University of Applied Sciences × Naturalis Biodiversity Center
</p>

---

## Key Findings

> **Statistically Significant Results**

<table>
<tr>
<td width="33%" align="center">
<img src="https://img.shields.io/badge/Contrast-Improved-15803d?style=flat-square&labelColor=f0fdf4" alt="Contrast">
<br><b>p = 0.002</b>
<br><sub>Real-time feedback significantly improved image contrast</sub>
</td>
<td width="33%" align="center">
<img src="https://img.shields.io/badge/Usability-+14.4%20points-0369a1?style=flat-square&labelColor=f0f9ff" alt="Usability">
<br><b>p = 0.0006</b>
<br><sub>Higher System Usability Scale scores for real-time feedback prototype</sub>
</td>
<td width="33%" align="center">
<img src="https://img.shields.io/badge/Dataset-183%20images-b45309?style=flat-square&labelColor=fef3c7" alt="Dataset">
<br><b>20 participants</b>
<br><sub>Three prototype conditions tested</sub>
</td>
</tr>
</table>



---

## Repository Structure

```
├── index.html                          # Project page (GitHub Pages)
├── static/                             # Static assets for project page
│   ├── images/                        # Visualizations and figures
│   ├── pdfs/                          # Research paper, poster, project plan
│   ├── css/                           # Stylesheets
│   └── js/                            # JavaScript for interactive elements
├── prototypes/                         # React-based prototype applications
│   ├── src/                           # Prototype source code
│   │   ├── pages/prototypes/         # Three prototype implementations
│   │   └── utils/                     # Image analysis utilities
│   └── README.md                      # Prototype documentation
├── image_quality_assessment/          # Image quality metric development
│   ├── expert_graded.csv             # Expert ratings (n=100)
│   ├── general_image_quality.ipynb   # Threshold calibration
│   └── iqa_thresholds.ipynb          # Threshold analysis
├── results_analysis/                  # Statistical analysis and visualization
│   ├── final_test/                   # Main study analysis (n=20)
│   │   ├── IQA_analysis.ipynb       # Image quality analysis
│   │   └── Usability_analysis.ipynb # SUS analysis
│   └── internal/                     # Preliminary user testing analysis
```

---

## Research Overview

### Abstract

Citizen science projects often depend on photographs submitted by volunteers. In paleontology, image quality is important for scientific evaluation, yet contributors usually receive no guidance while taking photos. This study examines whether feedback on image quality can improve fossil photographs at the moment of capture.

**Three prototype systems were compared:**

| Prototype | Type | Description |
|-----------|------|-------------|
| **P1** | Baseline | No feedback |
| **P2** | Post-Capture | Feedback after photo taken |
| **P3** | Real-Time | Continuous feedback during capture |

Image quality was measured using objective metrics (lighting, sharpness, contrast) and manual ratings (scale presence, viewing angle). Usability was evaluated using the System Usability Scale.

### Methodology

<table>
<tr><td><b>Design</b></td><td>Within-subjects comparative experimental design</td></tr>
<tr><td><b>Participants</b></td><td>20 participants (183 images collected)</td></tr>
<tr><td><b>Metrics</b></td><td>Lighting (mean gray value), Sharpness (Laplacian variance), Contrast (center-edge brightness difference), Manual ratings (scale, viewing angles)</td></tr>
<tr><td><b>Analysis</b></td><td>Non-parametric statistical tests (Kruskal-Wallis H, Mann-Whitney U, Wilcoxon signed-rank)</td></tr>
</table>

---

## Project Page

<div align="center">

**[→ View Interactive Project Page ←](https://meganspielberg.github.io/fossil-ai-feedback/)**

*Includes research abstract, visualizations, prototype demo video, full paper & poster*

</div>

---

## Prototypes

The three React-based prototypes are located in the `/prototypes` directory. Each implements different feedback mechanisms for fossil image capture.

### Running the Prototypes

```bash
cd prototypes
npm install
npm run dev
```

Access the prototypes at `http://localhost:5173`

> **Note:** Prototypes require a modern web browser with camera access permissions.

### Prototype Features

| Prototype | Features |
|-----------|----------|
| **P1 (Baseline)** | Basic image capture interface |
| **P2 (Post-Capture)** | Quality assessment shown after capture with retake option |
| **P3 (Real-Time)** | Live quality indicators during capture (lighting, sharpness, contrast) |

---

## Data Analysis

Analysis notebooks are available in `/results_analysis/final_test/`:

- **`IQA_analysis.ipynb`** — Image quality metric analysis, hypothesis testing, visualizations
- **`Usability_analysis.ipynb`** — System Usability Scale analysis, statistical comparisons

### Reproducing Analysis

```bash
# Install dependencies
pip install pandas numpy scipy matplotlib seaborn jupyter

# Launch Jupyter
jupyter notebook results_analysis/final_test/
```

---

## Citation

If you use this work in your research, please cite:

```bibtex
@misc{Spielberg2026FossilAI,
  title={Effect of Image Quality Feedback on Fossil Photo Submissions in Citizen Science},
  author={Spielberg, Megan},
  year={2026},
  institution={Fontys University of Applied Sciences},
  howpublished={Master's Thesis},
  url={https://meganspielberg.github.io/fossil-ai-feedback/}
}
```

---

## Acknowledgments

- **Naturalis Biodiversity Center** — Collaboration and domain expertise
- **Isaak Eijkelboom** (Paleontologist) — Expert image quality ratings
- **Fontys University of Applied Sciences** — Academic support
- Project page template adapted from [Nerfies](https://nerfies.github.io/)

---

## License

### Code
This project's code is available under the MIT License.

### Website & Documentation
<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>

The project website and documentation are licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

---

## Contact

**Megan Spielberg**  
Fontys University of Applied Sciences  
GitHub: [@MeganSpielberg](https://github.com/MeganSpielberg)

---

<p align="center">
  <b>Related Projects:</b> <a href="https://georgianagmanolache.github.io/legasea/">LegaSea Citizen Science Lab</a>
</p>
