# Sim-to-Real Transfer

> A policy trained in a simulator that fails on hardware is a policy that memorized the simulator. Domain randomization, domain adaptation, and system identification are the three tools to make learned controllers cross the reality gap.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 minutes

## Learning Objectives

- Formulate Sim-to-Real Transfer in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Training a real robot is slow, dangerous, and expensive. A biped takes millions of training episodes to learn to walk; a real biped that falls over even once breaks hardware. Simulation gives you unlimited resets, deterministic reproducibility, parallel environments, and no physical damage.

But simulators are wrong. Bearings have more friction than MuJoCo models. Cameras have lens distortion the simulator does not include. Motors have delays, backlash, and saturation that 99% of sim models skip. Wind, dust, and variable lighting sabotage a policy trained on sterile rendering. The **reality gap** — systematic difference between sim distribution and real distribution — is the central problem of deployed RL for robotics.

You need a policy that is *robust to sim-to-real distribution shift*. Three historical approaches: randomize the simulator (domain randomization), adapt the policy with a little real data (domain adaptation / fine-tuning), or identify the real system's parameters and match them (system identification). In 2026 the dominant recipe combines all three with massive parallel simulation (Isaac Sim, Isaac Lab, Mujoco MJX on GPU).

## The Concept

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR).** Tobin et al. 2017, Peng et al. 2018. During training, randomize every sim parameter that might differ on the real robot: masses, friction coefficients, motor PD gains, sensor noise, camera position, lighting, textures, contact models. The policy learns a conditional distribution over "which sim it is in today" and generalizes across the full span. If the real robot falls within the training envelope, the policy works.

- **Upside:** no real data needed. One recipe, many robots.
- **Downside:** over-randomized training produces a "universal" but overly cautious policy. Too much noise ≈ too much regularization.

**System Identification (SI).** Fit the simulator's parameters to real-world data before training. If you can measure arm-joint friction on the real robot, plug that into the sim. Then train a policy that expects those values. Needs access to the real system but reduces the reality gap directly.

- **Upside:** precise, low-noise training target.
- **Downside:** residual model error is invisible to the policy; small un-identified effects (e.g., motor deadband) still break deployment.

**Domain Adaptation.** Train in sim, fine-tune with a small amount of real data. Two flavors:

- **Real2Sim2Real:** learn a residual simulator `f(s, a, z) - f_sim(s, a)` using real rollouts, train in the corrected sim. Closes the gap without much real data.
- **Observation adaptation:** train a policy that maps real obs → sim-like obs via a learned feature extractor (e.g., GAN pixel-to-pixel). The controller stays in sim.

**Privileged learning / teacher-student.** Miki et al. 2022 (ANYmal quadruped). Train a *teacher* in simulation that has access to privileged information (ground truth friction, terrain height, IMU drift). Distill a *student* that only sees real-sensor observations. The student learns to infer privileged features from history, robust across physical parameters.

**Massively parallel simulation.** 2024–2026. Isaac Lab, Mujoco MJX, Brax all run thousands of parallel robots on a single GPU. PPO with 4,096 parallel humanoids collects years of experience in hours. The "reality gap" shrinks as training distribution widens; DR becomes almost free when each of those 4,096 envs has different randomized parameters.

**The real-world 2026 recipe (quadruped walking example):**

1. Massively parallel sim with domain-randomized gravity, friction, motor gains, payload.
2. Teacher policy trained with privileged info (terrain map, body velocity ground truth).
3. Student policy distilled from teacher using only proprioception (leg joint encoders).
4. Optional observation adaptation via autoencoder on real IMU.
5. Deploy. Zero-shot on 10+ environments. If it fails, do minutes of real-world fine-tuning with safety-constrained PPO.




## Further Reading

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) — the original DR paper (vision for robotics).
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) — DR for dynamics, quadruped locomotion.
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) — Dactyl, ADR at scale.
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) — teacher-student for ANYmal.
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) — the massively parallel sim that drives 2025–2026 deployments.
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) — ADR curriculum method.
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) — the Dyna framing (use a model for planning + rollouts) that underpins modern sim-to-real pipelines.
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) — taxonomy of sim-to-real methods with benchmark results.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Formulate Sim-to-Real Transfer in terms of states, actions, rewards, and objectives.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central update rule from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace learning signals through a self-terminating experiment.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Formulate Sim-to-Real Transfer in terms of states, actions, rewards, and objectives,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace learning signals through a self-terminating experiment,” and cite a repeatable check rather than relying on visual inspection alone.
