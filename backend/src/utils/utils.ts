export const randomNum = (max: number) => {
	const nums = Array.from({ length: max }, (_, index) => index);

	for (let i = max - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[nums[i], nums[j]] = [nums[j], nums[i]];
	}
	return nums[0];
};